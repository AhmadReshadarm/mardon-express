import axios from 'axios';
import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { Checkout } from '../../core/entities';
import { Subscription } from '../../core/entities';
import { Role } from '../../core/enums/roles.enum';
import { PaginationDTO } from '../../core/lib/dto';
import { HttpStatus } from '../../core/lib/http-status';
import { scope } from '../../core/middlewares/access.user';
import { OrderProductService } from '../../orders/orderProducts/orderProduct.service';
import { CheckoutDTO, CheckoutQueryDTO, UserAuth, UserDTO } from '../order.dtos';
import { createTransport, Transporter } from 'nodemailer';
import { MAIL_FROM, transportConfig } from './config';
import { MailOptionsDTO } from 'orders/mailer.dtos';

@singleton()
export class CheckoutService {
  private checkoutRepository: Repository<Checkout>;
  private subscribersRepository: Repository<Subscription>;
  private smptTransporter: Transporter;
  constructor(dataSource: DataSource, private orderProductService: OrderProductService) {
    this.checkoutRepository = dataSource.getRepository(Checkout);
    this.subscribersRepository = dataSource.getRepository(Subscription);
    this.smptTransporter = createTransport(transportConfig);
  }

  async getCheckouts(
    queryParams: CheckoutQueryDTO,
    authToken: string,
    userId: string,
  ): Promise<PaginationDTO<CheckoutDTO>> {
    const { addressId, basketId, sortBy = 'createdAt', orderBy = 'DESC', offset = 0, limit = 10 } = queryParams;

    const queryBuilder = this.checkoutRepository
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.address', 'address')
      .leftJoinAndSelect('checkout.basket', 'basket')
      .leftJoinAndSelect('basket.orderProducts', 'orderProduct');

    if (addressId) {
      queryBuilder.andWhere('checkout.addressId = :addressId', { addressId: addressId });
    }
    if (basketId) {
      queryBuilder.andWhere('checkout.basketId = :basketId', { basketId: basketId });
    }
    if (userId) {
      queryBuilder.andWhere('checkout.userId = :userId', { userId: userId });
    }
    queryBuilder.orderBy(`checkout.${sortBy}`, orderBy).skip(offset).take(limit);

    const checkouts = await queryBuilder.getMany();
    const result = checkouts.map(async checkout => await this.mergeCheckout(checkout, authToken));

    return {
      rows: await Promise.all(result),
      length: await queryBuilder.getCount(),
    };
  }

  async getAllCheckouts(queryParams: CheckoutQueryDTO, authToken: string): Promise<PaginationDTO<CheckoutDTO>> {
    const { addressId, basketId, userId, sortBy = 'createdAt', orderBy = 'DESC', offset = 0, limit = 10 } = queryParams;

    const queryBuilder = this.checkoutRepository
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.address', 'address')
      .leftJoinAndSelect('checkout.basket', 'basket')
      .leftJoinAndSelect('basket.orderProducts', 'orderProduct');

    if (addressId) {
      queryBuilder.andWhere('checkout.addressId = :addressId', { addressId: addressId });
    }
    if (basketId) {
      queryBuilder.andWhere('checkout.basketId = :basketId', { basketId: basketId });
    }
    if (userId) {
      queryBuilder.andWhere('checkout.userId = :userId', { userId: userId });
    }

    queryBuilder.orderBy(`checkout.${sortBy}`, orderBy).skip(offset).take(limit);

    const checkouts = await queryBuilder.getMany();

    const result = checkouts.map(async checkout => await this.mergeCheckout(checkout, authToken));

    return {
      rows: await Promise.all(result),
      length: await queryBuilder.getCount(),
    };
  }

  async getCheckout(id: string, authToken: string): Promise<CheckoutDTO> {
    const queryBuilder = await this.checkoutRepository
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.address', 'address')
      .leftJoinAndSelect('checkout.basket', 'basket')
      .leftJoinAndSelect('basket.orderProducts', 'orderProduct')
      .where('checkout.id = :id', { id: id })
      .getOne();

    if (!queryBuilder) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return this.mergeCheckout(queryBuilder, authToken);
  }

  async getCheckoutByPaymentId(paymentId: string, authToken: string): Promise<CheckoutDTO> {
    const queryBuilder = await this.checkoutRepository
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.address', 'address')
      .leftJoinAndSelect('checkout.basket', 'basket')
      .where('checkout.paymentId = :paymentId', { paymentId: paymentId })
      .getOne();

    if (!queryBuilder) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return this.mergeCheckout(queryBuilder, authToken);
  }

  async getUserById(id: string): Promise<UserDTO | undefined> {
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

  async createSubscriber(newSubscrition: Subscription): Promise<Subscription | null> {
    return this.subscribersRepository.save(newSubscrition);
  }

  async getSubscribers(): Promise<any> {
    return await this.subscribersRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async removeSubscriber(id: string) {
    const subscriber = await this.subscribersRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.subscribersRepository.remove(subscriber);
  }

  async updateSubscriber(subscriber: any, newSubscrition: Subscription) {
    const subscribtion = await this.subscribersRepository.findOneOrFail({
      where: {
        subscriber: Equal(subscriber),
      },
    });

    return this.subscribersRepository.save({
      ...subscribtion,
      ...newSubscrition,
    });
  }

  async createCheckout(newCheckout: Checkout): Promise<Checkout | null> {
    const created = await this.checkoutRepository.save(newCheckout);

    const checkout = await this.checkoutRepository
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.address', 'address')
      .leftJoinAndSelect('checkout.basket', 'basket')
      .leftJoinAndSelect('basket.orderProducts', 'orderProduct')
      .where('checkout.id = :id', { id: created.id })
      .getOne();

    // if (!(await this.validation(checkout.id, authToken))) {
    //   await this.checkoutRepository.remove(checkout);
    //   throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    // }

    return checkout;
  }

  async updateCheckout(id: string, checkoutDTO: Checkout, user: UserAuth): Promise<CheckoutDTO> {
    // const checkout = await this.checkoutRepository.findOneOrFail({
    //   where: {
    //     id: Equal(id),
    //   },
    // });

    // await this.isUserCheckoutOwner(checkout, user);

    // return this.checkoutRepository.save({
    //   ...checkout,
    //   ...checkoutDTO,
    // });

    await this.checkoutRepository
      .createQueryBuilder()
      .update()
      .set({
        status: checkoutDTO.status,
      })
      .where('id = :id', { id: id })
      .execute();

    const queryBuilder = await this.checkoutRepository
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.address', 'address')
      .leftJoinAndSelect('checkout.basket', 'basket')
      .leftJoinAndSelect('basket.orderProducts', 'orderProduct')
      .where('checkout.id = :id', { id: id })
      .getOne();

    if (!queryBuilder) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return this.mergeCheckout(queryBuilder, '_');
  }

  async removeCheckout(id: string, user: UserAuth) {
    const checkout = await this.checkoutRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });
    this.isUserCheckoutOwner(checkout, user);

    return this.checkoutRepository.remove(checkout);
  }

  isUserCheckoutOwner(checkout: Checkout, user: UserAuth) {
    if (scope(String(checkout.userId), String(user.id)) && user.role !== Role.Admin) {
      throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
  }

  async validation(id: string, authToken: string): Promise<boolean> {
    const checkout = (await this.getCheckout(id, authToken)) as any;

    if (String(checkout.user.id) !== String(checkout.basket.userId)) {
      return false;
    }
    if (String(checkout.user.id) !== String(checkout.address.userId)) {
      return false;
    }
    return true;
  }

  async mergeCheckout(checkout: Checkout, authToken: string): Promise<CheckoutDTO> {
    const orderProducts =
      checkout.basket.orderProducts?.map(orderProduct => this.orderProductService.mergeOrderProduct(orderProduct)) ??
      [];

    return {
      id: checkout.id,
      // paymentId: checkout.paymentId,
      totalAmount: checkout.totalAmount,
      user: (await this.getUserById(checkout.userId)) ?? checkout.userId,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
      basket: {
        ...checkout.basket,
        orderProducts: await Promise.all(orderProducts),
      },
      address: checkout.address,
      comment: checkout.comment,
      status: checkout.status,
    };
  }

  async sendMail(options: MailOptionsDTO) {
    this.validateMailOptions(options);

    // const result = await this.smptTransporter.sendMail({
    //   ...options,
    //   from: MAIL_FROM,
    // });

    // if (result.response === '250 2.0.0 Ok: queued') {
    //   return {
    //     status: HttpStatus.OK,
    //     response: {
    //       message: `Mail was successfully sent to ${options.to}`,
    //     },
    //   };
    // }
    let result: any;
    await this.smptTransporter.sendMail(
      {
        ...options,
        from: MAIL_FROM,
      },
      (err, info) => {
        if (err) {
          result = {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            response: {
              message: `Mail was unsuccessfull to be sent to ${options.to}, ${err}`,
            },
          };
        }
        result = {
          status: HttpStatus.OK,
          response: {
            message: `Mail was unsuccessfull to be sent to ${options.to}`,
          },
        };
      },
    );
    return result;
  }
  validateMailOptions(options: MailOptionsDTO) {
    if (!options.to || !options.html || !options.subject) {
      throw new CustomExternalError([ErrorCode.MAIL_OPTIONS], HttpStatus.BAD_REQUEST);
    }
  }
}
