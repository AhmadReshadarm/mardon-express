import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { OrderProduct, Product } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import axios from 'axios';
import {
  OrderProductDTO,
  OrderProductQueryDTO,
  OrderProductResponse,
  ProductDTO,
  UserAuth,
  UserDTO,
} from '../order.dtos';
import { scope } from '../../core/middlewares/access.user';
import { Role } from '../../core/enums/roles.enum';
import { v4 } from 'uuid';
import { PaginationDTO } from '../../core/lib/dto';

@singleton()
export class OrderProductService {
  private orderProductRepository: Repository<OrderProduct>;

  constructor(dataSource: DataSource) {
    this.orderProductRepository = dataSource.getRepository(OrderProduct);
  }

  async getOrderProducts(
    queryParams: OrderProductQueryDTO,
    authToken: string,
  ): Promise<PaginationDTO<OrderProductResponse>> {
    const {
      productId,
      userId,
      minQty,
      maxQty,
      minPrice,
      maxPrice,
      sortBy = 'productId',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = this.orderProductRepository
      .createQueryBuilder('orderProduct')
      .leftJoinAndSelect('orderProduct.inBasket', 'basket');

    if (productId) {
      queryBuilder.andWhere('orderProduct.productId = :productId', { productId: productId });
    }
    if (userId) {
      queryBuilder.andWhere('orderProduct.userId = :userId', { userId: userId });
    }
    if (minQty) {
      queryBuilder.andWhere('orderProduct.qty >= :qty', { qty: minQty });
    }
    if (maxQty) {
      queryBuilder.andWhere('orderProduct.qty <= :qty', { qty: maxQty });
    }
    if (minPrice) {
      queryBuilder.andWhere('orderProduct.productPrice >= :price', { price: minPrice });
    }
    if (maxPrice) {
      queryBuilder.andWhere('orderProduct.productPrice <= :price', { price: maxPrice });
    }

    queryBuilder.orderBy(`orderProduct.${sortBy}`, orderBy).skip(offset).take(limit);

    const orderProducts = await queryBuilder.getMany();
    const result = orderProducts.map(async orderProduct => await this.mergeOrderProduct(orderProduct));

    return {
      rows: await Promise.all(result),
      length: await queryBuilder.getCount(),
    };
  }

  async getOrderProductInner() {
    const foryous = await this.orderProductRepository.find();
    return foryous;
  }
  // async getOrderProductEntity(id: string): Promise<OrderProduct> {
  //   const orderProduct = await this.orderProductRepository.findOneOrFail({
  //     where: {
  //       id: Equal(id),
  //     }
  //   });
  //
  //   return orderProduct;
  // }

  async getOrderProduct(id: string, authToken: string): Promise<OrderProductResponse> {
    const queryBuilder = await this.orderProductRepository
      .createQueryBuilder('orderProduct')
      .leftJoinAndSelect('orderProduct.inBasket', 'basket')
      .where('orderProduct.id = :id', { id: id })
      .getOne();

    if (!queryBuilder) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return this.mergeOrderProduct(queryBuilder);
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

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const res = await axios.get(`${process.env.CATALOG_DB}/products/${id}`);

      return res.data;
    } catch (e: any) {
      if (e.name !== 'AxiosError') {
        throw new Error(e);
      }
    }
  }

  async getNewOrderProductId(): Promise<string> {
    const lastElement = await this.orderProductRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });

    return lastElement[0] ? String(+lastElement[0].id + 1) : String(1);
  }

  async createOrderProduct(
    newOrderProduct: OrderProduct,
    // , authToken: string
  ): Promise<OrderProduct> {
    const product = await this.getProductById(newOrderProduct.productId);
    const productVariant = product?.productVariants.find(variant => variant.id === newOrderProduct.productVariantId);

    newOrderProduct.productPrice = productVariant?.price ?? 0;
    newOrderProduct.id = v4();

    const orderProduct = await this.orderProductRepository.save(newOrderProduct);

    // if (!await this.validation(orderProduct.id, authToken)) {
    //   await this.orderProductRepository.remove(orderProduct)
    //   throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    // }

    return orderProduct;
  }
  // orderProductDTO: OrderProduct
  async updateOrderProduct(id: string, qty?: number, productSize?: string) {
    // const orderProduct = await this.orderProductRepository
    //   .createQueryBuilder('orderProduct')
    //   .leftJoinAndSelect('orderProduct.inBasket', 'basket')
    //   .where('orderProduct.id = :id', { id: id })
    //   .getOne();

    // const newOrderProduct = {} as OrderProduct;

    // Object.assign(newOrderProduct, orderProduct);
    // newOrderProduct.qty = orderProductDTO.qty;
    // newOrderProduct.productSize = orderProductDTO.productSize;

    // // if (user) {
    // //   await this.isUserOrderProductOwner(newOrderProduct, user);
    // // }

    // await this.orderProductRepository.remove(orderProduct!);

    // return this.orderProductRepository.save(newOrderProduct);

    await this.orderProductRepository
      .createQueryBuilder()
      .update()
      .set({
        qty: qty,
        productSize: productSize,
      })
      .where('id = :id', { id: id })
      .execute();

    return await this.orderProductRepository
      .createQueryBuilder('orderProduct')
      .leftJoinAndSelect('orderProduct.inBasket', 'basket')
      .where('orderProduct.id = :id', { id: id })
      .getOne();

    //  await this.commentRepository
    //    .createQueryBuilder()
    //    .update()
    //    .set({
    //      text: commentDTO.text,
    //    })
    //    .where('id = :id', { id: id })
    //    .execute();
    //  const queryBuilder = this.commentRepository
    //    .createQueryBuilder('comment')
    //    .leftJoinAndSelect('comment.review', 'review')
    //    .leftJoinAndSelect('comment.reactions', 'reactions');
    //  if (reviewId) {
    //    queryBuilder.andWhere('review.id = :id', { id: reviewId });
    //  }

    //  queryBuilder.orderBy(`comment.createdAt`, 'ASC').skip(0).take(1000);
    //  const comments = await queryBuilder.getMany();
    //  const result = comments.map(async comment => await this.mergeCommentUserId(comment, ''));
    //  return await Promise.all(result);
  }

  async removeOrderProduct(id: string) {
    const orderProduct = await this.orderProductRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.orderProductRepository.remove(orderProduct);
  }

  // isUserOrderProductOwner(orderProduct: OrderProduct, user: UserAuth) {
  //   if (scope(String(orderProduct.userId), String(user.id)) && user.role !== Role.Admin) {
  //     throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
  //   }
  // }

  async validation(id: string, authToken: string): Promise<boolean> {
    const orderProduct = (await this.getOrderProduct(id, authToken)) as any;

    return String(orderProduct.user.id) === String(orderProduct.inBasket.userId);
  }

  async mergeOrderProduct(orderProduct: OrderProduct): Promise<OrderProductResponse> {
    const product = await this.getProductById(orderProduct.productId);
    const productVariant = product?.productVariants.find(
      variant => variant.id.toString() === orderProduct.productVariantId.toString(),
    );

    return {
      id: orderProduct.id,
      product: product,
      productVariant: productVariant,
      // user: await this.getUserById(orderProduct.userId, authToken) ?? orderProduct.userId,
      qty: orderProduct.qty,
      productPrice: orderProduct.productPrice,
      productSize: orderProduct.productSize,
      inBasket: orderProduct.inBasket,
    };
  }
}
