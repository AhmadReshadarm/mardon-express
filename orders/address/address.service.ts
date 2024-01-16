import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { Address } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import axios from 'axios';
import { AddressDTO, AddressQueryDTO, UserAuth, UserDTO } from '../order.dtos';
import { Role } from '../../core/enums/roles.enum';
import { scope } from '../../core/middlewares/access.user';
import { PaginationDTO } from '../../core/lib/dto';

@singleton()
export class AddressService {
  private addressRepository: Repository<Address>;

  constructor(dataSource: DataSource) {
    this.addressRepository = dataSource.getRepository(Address);
  }

  async getAddresses(queryParams: AddressQueryDTO, authToken: string): Promise<PaginationDTO<AddressDTO>> {
    const {
      userId,
      receiverName,
      receiverPhone,
      address,
      zipCode,
      sortBy = 'userId',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = this.addressRepository
      .createQueryBuilder('address')
      .leftJoinAndSelect('address.checkouts', 'checkout');

    if (userId) {
      queryBuilder.andWhere('address.userId = :userId', { userId: userId });
    }
    if (receiverName) {
      queryBuilder.andWhere('address.receiverName = :receiverName', { receiverName: receiverName });
    }
    if (receiverPhone) {
      queryBuilder.andWhere('address.receiverPhone = :receiverPhone', { receiverPhone: receiverPhone });
    }
    if (address) {
      queryBuilder.andWhere('address.address = :address', { address: address });
    }
    if (zipCode) {
      queryBuilder.andWhere('address.zipCode = :zipCode', { zipCode: zipCode });
    }

    queryBuilder.orderBy(`address.${sortBy}`, orderBy).skip(offset).take(limit);

    const addresses = await queryBuilder.getMany();
    const result = addresses.map(async address => await this.mergeAddress(address, authToken));

    return {
      rows: await Promise.all(result),
      length: await queryBuilder.getCount(),
    };
  }

  async getAddress(id: string, authToken: string): Promise<AddressDTO> {
    const queryBuilder = await this.addressRepository
      .createQueryBuilder('address')
      .leftJoinAndSelect('address.checkouts', 'checkout')
      .where('address.id = :id', { id: id })
      .getOne();

    if (!queryBuilder) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return this.mergeAddress(queryBuilder, authToken);
  }

  async getUserById(id: string, authToken: string): Promise<UserDTO | undefined> {
    const options = {
      url: `${process.env.USERS_DB}/users/inner/${id}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      data: {
        secretKey: process.env.INNER_AUTH_CALL_SECRET_KEY,
      },
    };
    try {
      const res = await axios(options);
      return res.data;
    } catch (e: any) {
      if (e.name === 'AxiosError' && e.response.status === 403) {
        throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
      }
    }
  }

  async createAddress(newAddress: Address): Promise<Address> {
    return this.addressRepository.save(newAddress);
  }

  async updateAddress(id: string, addressDTO: Address, user: UserAuth) {
    const address = await this.addressRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });
    await this.isUserAddressOwner(address, user);

    return this.addressRepository.save({
      ...address,
      ...addressDTO,
    });
  }

  async removeAddress(id: string, user: UserAuth) {
    const address = await this.addressRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    await this.isUserAddressOwner(address, user);

    return this.addressRepository.remove(address);
  }

  isUserAddressOwner(address: Address, user: UserAuth) {
    if (scope(String(address.userId), String(user.id)) && user.role !== Role.Admin) {
      throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
  }

  async mergeAddress(address: Address, authToken: string): Promise<AddressDTO> {
    return {
      id: address.id,
      user: (await this.getUserById(address.userId, authToken)) ?? address.userId,
      receiverName: address.receiverName,
      receiverPhone: address.receiverPhone,
      address: address.address,
      roomOrOffice: address.roomOrOffice,
      door: address.door,
      floor: address.floor,
      rignBell: address.rignBell,
      zipCode: address.zipCode,
      checkouts: address.checkouts,
    };
  }
}
