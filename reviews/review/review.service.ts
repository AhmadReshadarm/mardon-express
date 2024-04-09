import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { ReactionReview, Review } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { CreateReactionDTO, ProductDTO, ReviewDTO, ReviewQueryDTO, UserAuth, UserDTO } from '../reviews.dtos';
import axios from 'axios';
import { scope } from '../../core/middlewares/access.user';
import { Role } from '../../core/enums/roles.enum';
import { PaginationDTO } from '../../core/lib/dto';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';

@singleton()
export class ReviewService {
  private reviewRepository: Repository<Review>;
  private reactionRepository: Repository<ReactionReview>;

  constructor(dataSource: DataSource) {
    this.reviewRepository = dataSource.getRepository(Review);
    this.reactionRepository = dataSource.getRepository(ReactionReview);
  }

  async getReviews(queryParams: ReviewQueryDTO): Promise<PaginationDTO<ReviewDTO | Review>> {
    const {
      productId,
      userId,
      showOnMain,
      sortBy = 'createdAt',
      orderBy = 'DESC',
      merge = 'true',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.comments', 'comments')
      .leftJoinAndSelect('review.reactions', 'reactions')
      .leftJoinAndSelect('comments.reactions', 'commentReactions');

    if (productId) {
      queryBuilder.andWhere('review.productId = :productId', { productId: productId });
    }
    if (userId) {
      queryBuilder.andWhere('review.userId = :userId', { userId: userId });
    }
    if (showOnMain) {
      queryBuilder.andWhere('review.showOnMain = :showOnMain', { showOnMain: JSON.parse(showOnMain as any) });
    }

    queryBuilder.orderBy(`review.${sortBy}`, orderBy).skip(offset).take(limit);

    return {
      rows: merge === 'true' ? await this.mergeReviews(queryBuilder) : await queryBuilder.getMany(),
      length: await queryBuilder.getCount(),
    };
  }

  async getReview(id: string): Promise<any> {
    const review = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.comments', 'comments')
      .leftJoinAndSelect('review.reactions', 'reactions')
      .where('review.id = :id', { id: id })
      .getOneOrFail();

    return await this.mergeReviewUserId(review);
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

  async getProductById(id: string): Promise<ProductDTO | undefined> {
    try {
      const res = await axios.get(`${process.env.CATALOG_DB}/products/${id}`);

      return res.data;
    } catch (e: any) {
      if (e.name !== 'AxiosError') {
        throw new Error(e);
      }
    }
  }

  async getCheckoutByUserId(authToken: string): Promise<ProductDTO | undefined> {
    // req.headers.authorization!
    try {
      let reqInstance = axios.create({
        headers: {
          Authorization: authToken,
        },
      });

      const res = await reqInstance.get(`${process.env.CHECKOUT_DB}/checkouts`);

      return res.data;
    } catch (e: any) {
      if (e.name !== 'AxiosError') {
        throw new Error(e);
      }
    }
  }

  async getNewReviewId(): Promise<string> {
    const lastElement = await this.reviewRepository.find({
      order: { id: 'DESC' },
      // take: 1,
    });
    const leatestElement = lastElement.sort(function (a, b) {
      return Number(b.id) - Number(a.id);
    });

    return lastElement[0] ? String(+leatestElement[0].id + 1) : String(1);
  }

  async getNewReactionId(): Promise<string> {
    const lastElement = await this.reactionRepository.find({
      order: { id: 'DESC' },
      // take: 1,
    });

    const leatestElement = lastElement.sort(function (a, b) {
      return Number(b.id) - Number(a.id);
    });

    return lastElement[0] ? String(+leatestElement[0].id + 1) : String(1);
  }

  async createReview(newReview: Review): Promise<ReviewDTO> {
    // const product = await this.getProductById(newReview.productId);
    // if (!product) {
    //   throw new CustomExternalError([ErrorCode.PRODUCT_NOT_FOUND], HttpStatus.NOT_FOUND);
    // }

    // const isReviewAlreadyPublished = !!product?.reviews?.find(review => review.user?.id == newReview.userId);
    // if (isReviewAlreadyPublished) {
    //   throw new CustomExternalError([ErrorCode.DUPLICATE_ENTRY], HttpStatus.CONFLICT);
    // }
    newReview.id = await this.getNewReviewId();

    const created = await this.reviewRepository.save(newReview);
    const fullReview = await this.getReview(created.id);

    return fullReview;
  }

  async createReaction(reaction: CreateReactionDTO): Promise<ReactionReview> {
    const review = await this.reviewRepository.findOneOrFail({
      where: {
        id: Equal(reaction.reviewId),
      },
    });

    const newReaction = new ReactionReview({
      id: reaction.id,
      userId: reaction.userId,
      review: review,
      reaction: reaction.reaction,
    });

    return this.reactionRepository.save(newReaction);
  }

  async updateReview(id: string, reviewDTO: Review, user: UserAuth) {
    const review = await this.reviewRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    const { productId, ...others } = reviewDTO;

    const newReview = {
      ...review,
      ...others,
    };
    await this.isUserReviewOwner(newReview, user);
    await this.reviewRepository.remove(review);

    return this.reviewRepository.save(newReview);
  }

  async removeReview(id: string, user: UserAuth) {
    const review = await this.reviewRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });
    // const images = review.images ? review.images.split(', ') : [];
    // images.map(async fileName => {
    //   await axios.delete(`${process.env.IMAGE_DB}/images/inner/${fileName}`).catch(error => {
    //     console.log(error);
    //   });
    // });

    this.isUserReviewOwner(review, user);
    const fullReview = await this.getReview(review.id);
    await this.reviewRepository.remove(review);
    return fullReview;
  }

  async removeReaction(id: string, user: UserAuth) {
    const reaction = await this.reactionRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    await this.isUserReactionOwner(reaction, user);

    this.reactionRepository.remove(reaction);
    return {
      ...reaction,
    };
  }

  isUserReviewOwner(review: Review, user: UserAuth) {
    if (scope(String(review.userId), String(user.id)) && user.role !== Role.Admin) {
      throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
  }

  isUserReactionOwner(reaction: ReactionReview, user: UserAuth) {
    if (scope(String(reaction.userId), String(user.id)) && user.role !== Role.Admin) {
      throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
  }

  async mergeReviews(queryBuilder: SelectQueryBuilder<Review>) {
    const reviews = await queryBuilder.getMany();
    const result = reviews.map(async review => await this.mergeReviewUserId(review));

    return Promise.all(result);
  }

  async mergeReviewUserId(review: Review): Promise<ReviewDTO> {
    return {
      id: review.id,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      showOnMain: review.showOnMain,
      product: (await this.getProductById(review.productId)) ?? review.productId,
      user: (await this.getUserById(review.userId)) ?? review.userId,
      comments: review.comments,
      reactions: review.reactions,
      images: review.images,
    };
  }
}
