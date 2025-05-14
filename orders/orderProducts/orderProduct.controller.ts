import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Role } from '../../core/enums/roles.enum';
import { HttpStatus } from '../../core/lib/http-status';
import { isUser, verifyToken } from '../../core/middlewares';
import { OrderProductService } from './orderProduct.service';

@singleton()
@Controller('/order-products')
export class OrderProductController {
  constructor(private orderProductService: OrderProductService) {}

  @Get()
  @Middleware([verifyToken, isUser])
  async getOrderProducts(req: Request, resp: Response) {
    if (resp.locals.user.role !== Role.Admin) {
      req.query.userId = String(resp.locals.user.id);
    }

    const orderProducts = await this.orderProductService.getOrderProducts(req.query);

    resp.json(orderProducts);
  }

  @Get(':id')
  @Middleware([verifyToken, isUser])
  async getOrderProduct(req: Request, resp: Response) {
    const { id } = req.params;
    const orderProduct = await this.orderProductService.getOrderProduct(id);

    resp.json(orderProduct);
  }

  @Post(':id')
  async createOrder(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const orderProducts = await this.orderProductService.createOrderProduct(id, req.body);
      resp.status(HttpStatus.OK).json(orderProducts);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Put(':id')
  async updateOrder(req: Request, resp: Response) {
    const { id } = req.params;
    const { offset, limit } = req.body;
    try {
      const orderProducts = await this.orderProductService.updateOrderProductQtyInCart(id, req.body, offset, limit);
      resp.status(HttpStatus.OK).json(orderProducts);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete(':id')
  async removeOrder(req: Request, resp: Response) {
    const { id } = req.params;
    const { offset, limit } = req.body;
    try {
      const orderProducts = await this.orderProductService.removeOrderProductFromCart(id, req.body, offset, limit);
      resp.status(HttpStatus.OK).json(orderProducts);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('inner')
  async innerGet(req: Request, resp: Response) {
    const { secretKey } = req.body;
    if (secretKey !== process.env.INNER_SECRET_KEY) {
      resp.status(HttpStatus.FORBIDDEN).json({ message: 'access denied' });
      return;
    }
    const orders = this.orderProductService.getOrderProductInner();

    resp.json(orders);
  }
}
