import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { Basket, OrderProduct, Product, Review } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
// import axios from 'axios';
import {
  BasketDTO,
  OrderProductQueryDTO,
  OrderProductResponse,
  ProductDTO,
  // ProductQueryDTO,
  ReviewQueryDTO,
  // UserDTO,
} from '../order.dtos';
import { v4 } from 'uuid';
import { PaginationDTO, RatingDTO } from '../../core/lib/dto';

@singleton()
export class OrderProductService {
  private orderProductRepository: Repository<OrderProduct>;
  private basketRepository: Repository<Basket>;
  private productRepository: Repository<Product>;
  private reviewRepository: Repository<Review>;
  constructor(dataSource: DataSource) {
    this.orderProductRepository = dataSource.getRepository(OrderProduct);
    this.basketRepository = dataSource.getRepository(Basket);
    this.productRepository = dataSource.getRepository(Product);
    this.reviewRepository = dataSource.getRepository(Review);
  }

  async getOrderProducts(queryParams: OrderProductQueryDTO): Promise<PaginationDTO<OrderProductResponse>> {
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

  async getOrderProduct(id: string): Promise<OrderProductResponse> {
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

  // async getUserById(id: string, authToken: string): Promise<UserDTO | undefined> {
  //   try {
  //     const res = await axios.get(`${process.env.USERS_DB}/users/inner/${id}`, {
  //       headers: {
  //         Authorization: authToken!,
  //       },
  //     });

  //     return res.data;
  //   } catch (e: any) {
  //     if (e.name === 'AxiosError' && e.response.status === 403) {
  //       throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
  //     }
  //   }
  // }

  // async getProductById(id: string): Promise<Product | undefined> {
  //   try {
  //     const res = await axios.get(`${process.env.CATALOG_DB}/products/${id}`);

  //     return res.data;
  //   } catch (e: any) {
  //     if (e.name !== 'AxiosError') {
  //       throw new Error(e);
  //     }
  //   }
  // }

  async getNewOrderProductId(): Promise<string> {
    const lastElement = await this.orderProductRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });

    return lastElement[0] ? String(+lastElement[0].id + 1) : String(1);
  }

  async createOrderProduct(id: string, newOrderProduct: OrderProduct): Promise<BasketDTO> {
    const basket = await this.basketRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['orderProducts'],
    });

    const product = await this.getProduct(newOrderProduct.productId);
    const productVariant = product?.productVariants.find(variant => variant.id === newOrderProduct.productVariantId);

    newOrderProduct.productPrice = productVariant?.price ?? 0;
    newOrderProduct.id = v4();
    newOrderProduct.inBasket = basket;
    newOrderProduct.basketId = basket.id;

    await this.orderProductRepository.save(newOrderProduct);

    return await this.getBasket(id);
  }

  async updateOrderProductQtyInCart(basketId: string, orderDTO: OrderProduct): Promise<any> {
    await this.orderProductRepository.save({
      ...orderDTO,
      qty: orderDTO.qty,
    });

    return await this.getBasket(basketId);
  }

  async removeOrderProductFromCart(basketId: string, orderProductToRemove: OrderProduct): Promise<BasketDTO> {
    await this.orderProductRepository.remove(orderProductToRemove);

    return await this.getBasket(basketId);
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

  async removeOrderProduct(id: string) {
    const orderProduct = await this.orderProductRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.orderProductRepository.remove(orderProduct);
  }

  async validation(id: string, authToken: string): Promise<boolean> {
    const orderProduct = (await this.getOrderProduct(id)) as any;

    return String(orderProduct.user.id) === String(orderProduct.inBasket.userId);
  }

  getTotalAmount(products: OrderProduct[]): number {
    return products.reduce((accum: number, product) => {
      accum += product.qty * product.productPrice;

      return accum;
    }, 0);
  }

  async mergeOrderProduct(orderProduct: OrderProduct): Promise<OrderProductResponse> {
    const product = await this.getProduct(orderProduct.productId);
    const productVariant = product?.productVariants.find(
      variant => variant.id.toString() === orderProduct.productVariantId.toString(),
    );

    return {
      id: orderProduct.id,
      product: product,
      productVariant: productVariant,
      qty: orderProduct.qty,
      productPrice: orderProduct.productPrice,
      inBasket: orderProduct.inBasket,
    };
  }

  async mergeBasket(basket: Basket): Promise<BasketDTO> {
    const orderProducts = basket.orderProducts.map(orderProduct => this.mergeOrderProduct(orderProduct));

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

  // fetch product by id 👇
  async getProduct(id: string): Promise<ProductDTO> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.tags', 'tag')
      .leftJoinAndSelect('category.parameters', 'parameter')
      .leftJoinAndSelect('product.parameterProducts', 'parameterProducts')
      .leftJoinAndSelect('product.productVariants', 'productVariant')
      .leftJoinAndSelect('productVariant.color', 'color')
      .where('product.id = :id', { id: id })
      .getOne();

    if (!product) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return this.mergeProduct(product);
  }

  async mergeProduct(product: Product): Promise<any> {
    const rawReviews = await this.getReviews({
      productId: product.id,
      limit: 100000,
    });
    const rating = rawReviews ? await this.getProductRatingFromReviews(rawReviews) : null;

    return {
      ...product,
      rating: rating,
      reviewCount: rawReviews.length,
    };
  }

  async getProductRatingFromReviews(reviews: PaginationDTO<Review>): Promise<RatingDTO | null> {
    let counter: number = 0;
    let totalRating: number = 0;

    const rating: RatingDTO = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      'avg': 0,
    };

    reviews.rows.map((review: Review) => {
      const index = String(review.rating);
      rating[index as keyof typeof rating] += 1;

      totalRating += review.rating;
      counter += 1;
    });

    rating.avg = +(totalRating / counter).toFixed(2);
    return rating;
  }

  async getReviews(queryParams: ReviewQueryDTO): Promise<PaginationDTO<Review>> {
    const { productId, sortBy = 'createdAt', orderBy = 'DESC', offset = 0, limit = 10 } = queryParams;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.comments', 'comments')
      .leftJoinAndSelect('review.reactions', 'reactions')
      .leftJoinAndSelect('comments.reactions', 'commentReactions');

    if (productId) {
      queryBuilder.andWhere('review.productId = :productId', { productId: productId });
    }

    queryBuilder.orderBy(`review.${sortBy}`, orderBy).skip(offset).take(limit);

    return {
      rows: await queryBuilder.getMany(),
      length: await queryBuilder.getCount(),
    };
  }
}
