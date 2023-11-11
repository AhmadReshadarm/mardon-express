import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { Basket } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { BasketService } from './basket.service';
import { isAdmin, isUser, verifyToken } from '../../core/middlewares';
import { Role } from '../../core/enums/roles.enum';

@singleton()
@Controller('/baskets')
export class BasketController {
  constructor(private basketService: BasketService) {}

  @Get()
  // @Middleware([verifyToken, isAdmin])
  async getBaskets(req: Request, resp: Response) {
    // if (resp.locals.user?.role !== Role.Admin) {
    //   req.query.userId = String(resp.locals.user?.id);
    // }
    try {
      const baskets = await this.basketService.getBaskets(req.query);
      resp.json(baskets);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(`somthing went wrong ${error}`);
    }
  }

  @Get(':id')
  // @Middleware([verifyToken, isUser])
  async getBasket(req: Request, resp: Response) {
    const { id } = req.params;
    const basket = await this.basketService.getBasket(id);

    resp.json(basket);
  }

  @Post()
  // @Middleware([verifyToken, isUser])
  async createBasket(req: Request, resp: Response) {
    const newBasket = new Basket(req.body);
    try {
      await validation(newBasket);

      const created = await this.basketService.createBasket(newBasket);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(`somthing went wrong ${error}`);
    }
  }

  @Get('clear/:id')
  async clearBasket(req: Request, resp: Response) {
    const { id } = req.params;

    try {
      const updated = await this.basketService.clearBasket(id);
      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(`somthing went wrong ${error}`);
    }
  }

  @Put(':id')
  // @Middleware([verifyToken, isUser])
  async updateBasket(req: Request, resp: Response) {
    const { id } = req.params;

    try {
      const updated = await this.basketService.updateBasket(id, req.body);
      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isUser])
  async removeBasket(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const removed = await this.basketService.removeBasket(id, resp.locals.user);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(`somthing went wrong ${error}`);
    }
  }
}
