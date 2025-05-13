import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository, In } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { Basket, OrderProduct } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import axios from 'axios';
import { BasketDTO, BasketQueryDTO, UserAuth, UserDTO } from '../order.dtos';
import { Role } from '../../core/enums/roles.enum';
import { scope } from '../../core/middlewares/access.user';
import { OrderProductService } from '../orderProducts/orderProduct.service';
import { PaginationDTO } from '../../core/lib/dto';

@singleton()
export class BasketService {
  private basketRepository: Repository<Basket>;
  private orderProductRepository: Repository<OrderProduct>;

  constructor(dataSource: DataSource, private orderProductService: OrderProductService) {
    this.basketRepository = dataSource.getRepository(Basket);
    this.orderProductRepository = dataSource.getRepository(OrderProduct);
  }

  async getBaskets(queryParams: BasketQueryDTO): Promise<PaginationDTO<BasketDTO>> {
    const {
      userId,
      minTotalAmount,
      maxTotalAmount,
      updatedFrom,
      updatedTo,
      sortBy = 'userId',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = this.basketRepository
      .createQueryBuilder('basket')
      .leftJoinAndSelect('basket.orderProducts', 'orderProduct')
      .leftJoinAndSelect('basket.checkout', 'checkout');

    if (userId) {
      queryBuilder.andWhere('basket.userId = :userId', { userId: userId });
    }
    if (minTotalAmount) {
      queryBuilder.andWhere('basket.productTotalAmount >= :minAmount', { minAmount: minTotalAmount });
    }
    if (maxTotalAmount) {
      queryBuilder.andWhere('basket.productTotalAmount <= :maxAmount', { maxAmount: maxTotalAmount });
    }
    if (updatedFrom) {
      queryBuilder.andWhere('basket.updatedAt >= :dateFrom', { dateFrom: updatedFrom });
    }
    if (updatedTo) {
      queryBuilder.andWhere('basket.updatedAt <= :dateTo', { dateTo: updatedTo });
    }

    queryBuilder.orderBy(`basket.${sortBy}`, orderBy).skip(offset).take(limit);

    const baskets = await queryBuilder.getMany();
    const result = baskets.map(async basket => await this.mergeBasket(basket));

    return {
      rows: await Promise.all(result),
      length: await queryBuilder.getCount(),
    };
  }

  async getBasket(id: string, offset: number, limit: number): Promise<BasketDTO> {
    const queryBuilder = await this.basketRepository
      .createQueryBuilder('basket')
      .leftJoinAndSelect('basket.orderProducts', 'orderProduct')
      .leftJoinAndSelect('basket.checkout', 'checkout')
      .where('basket.id = :id', { id: id })
      .getOne();

    if (!queryBuilder) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    // return this.mergeBasket(queryBuilder);
    return this.orderProductService.mergeBasket(queryBuilder, offset, limit);
  }

  async getUserById(id: string, authToken: string): Promise<UserDTO | undefined> {
    try {
      const res = await axios.get(`${process.env.USERS_DB}/users/inner/${id}`, {
        headers: {
          Authorization: authToken!,
        },
      });

      return res.data;
    } catch (e: any) {
      if (e.name === 'AxiosError' && e.response.status === 403) {
        throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
      }
    }
  }

  getTotalAmount(products: OrderProduct[]): number {
    return products.reduce((accum: number, product) => {
      accum += product.qty * product.productPrice;

      return accum;
    }, 0);
  }

  async createBasket(newBasket: Basket): Promise<Basket> {
    return this.basketRepository.save(newBasket);
  }

  async clearBasket(id: string) {
    const basket = await this.basketRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['orderProducts'],
    });

    basket.orderProducts.forEach(orderProduct => {
      this.orderProductRepository.remove(orderProduct);
    });

    return {
      ...basket,
      orderProducts: [],
      totalAmount: 0,
    };
  }

  async removeBasket(id: string, user: UserAuth) {
    const basket = await this.basketRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    if (user) {
      await this.checkIfUserBasketOwner(basket, user);
    }

    return this.basketRepository.remove(basket);
  }

  checkIfUserBasketOwner(basket: Basket, user: UserAuth) {
    if (scope(String(basket.userId), String(user.id)) && user.role !== Role.Admin) {
      throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
  }

  async mergeBasket(basket: Basket): Promise<BasketDTO> {
    const orderProducts = basket.orderProducts.map(orderProduct =>
      this.orderProductService.mergeOrderProduct(orderProduct),
    );
    return {
      id: basket.id,
      userId: basket.userId ?? null,
      orderProducts: await Promise.all(orderProducts),
      checkout: basket.checkout,
      totalAmount: this.getTotalAmount(basket.orderProducts),
      createdAt: basket.createdAt,
      updatedAt: basket.updatedAt,
    };
  }
}
