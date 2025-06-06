import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { Basket } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { BasketService } from './basket.service';
import { isUser, verifyToken } from '../../core/middlewares';

@singleton()
@Controller('/baskets')
export class BasketController {
  constructor(private basketService: BasketService) {}

  @Get()
  async getBaskets(req: Request, resp: Response) {
    try {
      const baskets = await this.basketService.getBaskets(req.query);
      resp.json(baskets);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get(':id')
  async getBasket(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const basket = await this.basketService.getBasket(id);

      resp.json(basket);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post()
  async createBasket(req: Request, resp: Response) {
    const newBasket = new Basket(req.body);
    try {
      await validation(newBasket);

      const created = await this.basketService.createBasket(newBasket);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('clear/:id')
  async clearBasket(req: Request, resp: Response) {
    const { id } = req.params;

    try {
      const updated = await this.basketService.clearBasket(id);
      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  // @Put(':id')
  // async updateBasket(req: Request, resp: Response) {
  //   const { id } = req.params;

  //   try {
  //     const updated = await this.basketService.updateBasket(id, req.body);
  //     resp.status(HttpStatus.OK).json(updated);
  //   } catch (error) {
  //     resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
  //   }
  // }

  @Delete(':id')
  @Middleware([verifyToken, isUser])
  async removeBasket(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const removed = await this.basketService.removeBasket(id, resp.locals.user);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
