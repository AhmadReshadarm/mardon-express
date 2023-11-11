import { NextFunction, Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { ReactionReview, Review } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { ReviewService } from './review.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isUser, verifyToken } from '../../core/middlewares';
import { Role } from '../../core/enums/roles.enum';
import { CreateReactionDTO } from '../reviews.dtos';
import axios from 'axios';

@singleton()
@Controller('/reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Get()
  async getReviews(req: Request, resp: Response) {
    try {
      const reviews = await this.reviewService.getReviews(req.query);

      resp.json(reviews);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get(':id')
  @Middleware([verifyToken, isUser])
  async getReview(req: Request, resp: Response) {
    const { id } = req.params;

    try {
      const review = await this.reviewService.getReview(id);

      resp.json(review);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post()
  @Middleware([verifyToken, isUser])
  async createReview(req: Request, resp: Response) {
    try {
      const newReview = new Review(req.body);
      newReview.userId = resp.locals.user.id;

      if (resp.locals.user.role != Role.Admin) {
        newReview.showOnMain = false;
      }

      const product = await this.reviewService.getProductById(newReview.productId);
      if (!product) {
        return resp.status(HttpStatus.NOT_FOUND).json('product not founnd');
      }

      const isReviewAlreadyPublished = !!product?.reviews?.find(review => review.user?.id == newReview.userId);
      if (isReviewAlreadyPublished) {
        return resp.status(HttpStatus.CONFLICT).json('already published');
      }
      const checkouts = await this.reviewService.getCheckoutByUserId(req.headers.authorization!);
      const isInUserCheckout = (productId: string, checkedOuts: any) => {
        let isInBasket = false;
        checkedOuts.rows.map((checkout: any) => {
          checkout.basket?.orderProducts!.find((productInbasket: any) => {
            if (productInbasket.product?.id === productId) {
              isInBasket = true;
              return;
            }
          });
        });

        return isInBasket ? true : false;
      };

      if (!isInUserCheckout(req.body.productId, checkouts) && resp.locals.user.role !== Role.Admin) {
        return resp.status(HttpStatus.FORBIDDEN).json('not in checkout');
      }

      await validation(newReview);
      const created = await this.reviewService.createReview(newReview);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post('reaction')
  @Middleware([verifyToken, isUser])
  async createReaction(req: Request, resp: Response) {
    try {
      req.body.userId = resp.locals.user.id;

      const reaction: CreateReactionDTO = req.body;
      reaction.id = await this.reviewService.getNewReactionId();
      await validation(reaction);

      const created = await this.reviewService.createReaction(reaction);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isUser])
  async updateReview(req: Request, resp: Response) {
    const { id } = req.params;

    try {
      if (resp.locals.user.role != Role.Admin) {
        req.body.showOnMain = undefined;
      }

      const updated = await this.reviewService.updateReview(id, req.body, resp.locals.user);

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isUser])
  async removeReview(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const review = await this.reviewService.getReview(id);

      if (review.comments.length > 0 || review.showOnMain) {
        return resp.status(HttpStatus.FORBIDDEN).json('Not allowed file has sub files or is on main page');
      }

      const removed = await this.reviewService.removeReview(id, resp.locals.user);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete('reaction/:id')
  @Middleware([verifyToken, isUser])
  async removeReaction(req: Request, resp: Response) {
    const { id } = req.params;

    try {
      const removed = await this.reviewService.removeReaction(id, resp.locals.user);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
