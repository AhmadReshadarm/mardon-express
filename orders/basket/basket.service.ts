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

  constructor(
    dataSource: DataSource,
    private orderProductService: OrderProductService,
  ) {
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

    // if (user) {
    //   await this.checkIfUserBasketOwner(basket, user);
    // }

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

    // for (const { productId, qty, productSize, productVariantId } of basketDTO.orderProducts) {
    //   const orderProduct = await this.orderProductRepository.findOne({
    //     where: {
    //       productId: Equal(productId),
    //       basketId: Equal(basket.id),
    //     },
    //   });

    //   if (!orderProduct) {
    //     const orderProductData = new OrderProduct({ productId, qty, productSize, inBasket: basket, productVariantId });
    //     const newOrderProduct = await this.orderProductService.createOrderProduct(orderProductData);
    //     orderProducts.push(await this.orderProductService.mergeOrderProduct(newOrderProduct));
    //   }

    //   if (orderProduct && orderProduct.qty !== qty) {
    //     // console.log('__________________________this happend_________________________');

    //     const newOrderProduct = await this.orderProductService.updateOrderProduct(orderProduct.id, {
    //       ...orderProduct,
    //       qty,
    //     });
    //     const curOrderProduct = orderProducts.find(orderProduct => orderProduct.id === newOrderProduct?.id)!;
    //     curOrderProduct.qty = qty;
    //   }
    //   if (orderProduct && orderProduct.productSize !== productSize) {
    //     const newOrderProduct = await this.orderProductService.updateOrderProduct(orderProduct.id, {
    //       ...orderProduct,
    //       productSize,
    //     });
    //     const curOrderProduct = orderProducts.find(orderProduct => orderProduct.id === newOrderProduct?.id)!;
    //     curOrderProduct.productSize = productSize;
    //   }
    // }
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
            basketDTO.orderProducts[counter].productSize ?? '',
            //    {
            //   ...orderProduct,
            //   qty: basketDTO.orderProducts[counter].qty,

            // }
          );
          const curOrderProduct = orderProducts.find(orderProduct => orderProduct.id === newOrderProduct?.id)!;
          curOrderProduct.qty = basketDTO.orderProducts[counter].qty;
        }
        if (orderProduct && orderProduct.productSize !== basketDTO.orderProducts[counter].productSize) {
          const newOrderProduct = await this.orderProductService.updateOrderProduct(
            orderProduct.id,
            basketDTO.orderProducts[counter].qty ?? 1,
            basketDTO.orderProducts[counter].productSize,
            //    {
            //   ...orderProduct,
            //   productSize: basketDTO.orderProducts[counter].productSize,
            // }
          );
          const curOrderProduct = orderProducts.find(orderProduct => orderProduct.id === newOrderProduct?.id)!;
          curOrderProduct.productSize = basketDTO.orderProducts[counter].productSize;
        }

        if (!orderProduct) {
          const orderProductData = new OrderProduct({
            productId: basketDTO.orderProducts[counter].productId,
            qty: basketDTO.orderProducts[counter].qty,
            productSize: basketDTO.orderProducts[counter].productSize,
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
    // basketDTO.orderProducts.map(async ({ productId, qty, productSize, productVariantId }) => {
    //   const orderProduct = await this.orderProductRepository.findOne({
    //     where: {
    //       productId: Equal(productId),
    //       basketId: Equal(basket.id),
    //     },
    //   });

    //   if (!orderProduct) {
    //     const orderProductData = new OrderProduct({
    //       productId,
    //       qty,
    //       productSize,
    //       inBasket: basket,
    //       productVariantId,
    //     });
    //     const newOrderProduct = await this.orderProductService.createOrderProduct(orderProductData);
    //     orderProducts.push(await this.orderProductService.mergeOrderProduct(newOrderProduct));
    //   }

    //   if (orderProduct && orderProduct.qty !== qty) {
    //     // console.log('__________________________this happend_________________________');

    //     const newOrderProduct = await this.orderProductService.updateOrderProduct(orderProduct.id, {
    //       ...orderProduct,
    //       qty,
    //     });
    //     const curOrderProduct = orderProducts.find(orderProduct => orderProduct.id === newOrderProduct?.id)!;
    //     curOrderProduct.qty = qty;
    //   }
    //   if (orderProduct && orderProduct.productSize !== productSize) {
    //     const newOrderProduct = await this.orderProductService.updateOrderProduct(orderProduct.id, {
    //       ...orderProduct,
    //       productSize,
    //     });
    //     const curOrderProduct = orderProducts.find(orderProduct => orderProduct.id === newOrderProduct?.id)!;
    //     curOrderProduct.productSize = productSize;
    //   }
    // });

    return {
      ...basket,
      orderProducts,
    };
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
