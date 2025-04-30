import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { Basket, OrderProduct } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import axios from 'axios';
import { BasketDTO, BasketQueryDTO, OrderProductResponse, UserAuth, UserDTO } from '../order.dtos';
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

  async getBasket(id: string): Promise<BasketDTO> {
    const queryBuilder = await this.basketRepository
      .createQueryBuilder('basket')
      .leftJoinAndSelect('basket.orderProducts', 'orderProduct')
      .leftJoinAndSelect('basket.checkout', 'checkout')
      .where('basket.id = :id', { id: id })
      .getOne();

    if (!queryBuilder) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return this.mergeBasket(queryBuilder);
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

  async updateBasket(id: string, basketDTO: Basket) {
    const basket = await this.basketRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['orderProducts'],
    });

    basket.orderProducts.forEach(orderProduct => {
      const curOrderProduct = basketDTO.orderProducts.find(
        ({ productId }) => orderProduct.productId === productId.toString(),
      );

      if (!curOrderProduct) {
        this.orderProductRepository.remove(orderProduct);
        basket.orderProducts = basket.orderProducts.filter(curOrderProduct => curOrderProduct.id !== orderProduct.id);
      }
    });

    const promises = basket.orderProducts.map(orderProduct => this.orderProductService.mergeOrderProduct(orderProduct));

    const orderProducts = await Promise.all(promises);

    let counter = 0;
    const updateOrderProductDetails = async () => {
      if (counter < basketDTO.orderProducts.length) {
        const orderProduct = await this.orderProductRepository.findOne({
          where: {
            productId: Equal(basketDTO.orderProducts[counter].productId),
            basketId: Equal(basket.id),
          },
        });

        if (orderProduct && orderProduct.qty !== basketDTO.orderProducts[counter].qty) {
          const newOrderProduct = await this.orderProductService.updateOrderProduct(
            orderProduct.id,
            basketDTO.orderProducts[counter].qty,
            // basketDTO.orderProducts[counter].productSize ?? '',
          );
          const curOrderProduct = orderProducts.find(orderProduct => orderProduct.id === newOrderProduct?.id)!;
          curOrderProduct.qty = basketDTO.orderProducts[counter].qty;
        }
        // && orderProduct.productSize !== basketDTO.orderProducts[counter].productSize
        if (orderProduct) {
          const newOrderProduct = await this.orderProductService.updateOrderProduct(
            orderProduct.id,
            basketDTO.orderProducts[counter].qty ?? 1,
            // basketDTO.orderProducts[counter].productSize,
          );
          const curOrderProduct = orderProducts.find(orderProduct => orderProduct.id === newOrderProduct?.id)!;
          // curOrderProduct.productSize = basketDTO.orderProducts[counter].productSize;
        }

        if (!orderProduct) {
          const orderProductData = new OrderProduct({
            productId: basketDTO.orderProducts[counter].productId,
            qty: basketDTO.orderProducts[counter].qty,
            // productSize: basketDTO.orderProducts[counter].productSize,
            inBasket: basket,
            productVariantId: basketDTO.orderProducts[counter].productVariantId,
          });
          const newOrderProduct = await this.orderProductService.createOrderProduct(orderProductData);
          orderProducts.push(await this.orderProductService.mergeOrderProduct(newOrderProduct));
        }
        counter = counter + 1;
        updateOrderProductDetails();
      }
    };

    await updateOrderProductDetails();
    function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    await sleep(300);

    return {
      ...basket,
      orderProducts,
    };
  }

  // async updateBasket(id: string, basketDTO: Basket) {
  //   const basket = await this.basketRepository.findOneOrFail({
  //     where: { id: Equal(id) },
  //     relations: ['orderProducts'],
  //   });

  //   // Convert to maps for efficient lookup
  //   const existingMap = new Map(basket.orderProducts.map(op => [op.productId.toString(), op]));
  //   const newMap = new Map(basketDTO.orderProducts.map(dto => [dto.productId.toString(), dto]));

  //   // Handle deletions first
  //   const toRemove = basket.orderProducts.filter(op => !newMap.has(op.productId.toString()));

  //   // Use query builder for batch delete
  //   if (toRemove.length > 0) {
  //     await this.orderProductRepository
  //       .createQueryBuilder()
  //       .delete()
  //       .whereInIds(toRemove.map(op => op.id))
  //       .execute();
  //   }

  //   // Process updates/creates in batches
  //   const BATCH_SIZE = 10;
  //   const operations = [];

  //   for (const dto of basketDTO.orderProducts) {
  //     const productId = dto.productId.toString();
  //     const existing = existingMap.get(productId);

  //     if (existing) {
  //       if (existing.qty !== dto.qty) {
  //         operations.push(() => this.orderProductService.updateOrderProduct(existing.id, dto.qty));
  //       }
  //     } else {
  //       operations.push(() =>
  //         this.orderProductRepository.save(
  //           this.orderProductRepository.create({
  //             productId: dto.productId,
  //             qty: dto.qty,
  //             basketId: basket.id,
  //             productVariantId: dto.productVariantId,
  //           }),
  //         ),
  //       );
  //     }
  //   }

  //   // Process in batches to avoid connection pool issues
  //   for (let i = 0; i < operations.length; i += BATCH_SIZE) {
  //     const batch = operations.slice(i, i + BATCH_SIZE);
  //     await Promise.all(batch.map(fn => fn()));
  //   }

  //   // Get updated order products and merge them
  //   const updatedOrderProducts = await this.orderProductRepository.find({
  //     where: { basketId: id },
  //   });

  //   // Use your existing merge logic
  //   const mergedProducts = await Promise.all(
  //     updatedOrderProducts.map(async op => await this.orderProductService.mergeOrderProduct(op)),
  //   );

  //   return {
  //     ...basket,
  //     orderProducts: mergedProducts,
  //   };
  // }

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
