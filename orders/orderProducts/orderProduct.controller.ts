import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { Controller, Delete, Get, Middleware, Put } from '../../core/decorators';
import { Role } from '../../core/enums/roles.enum';
import { HttpStatus } from '../../core/lib/http-status';
import { isAdmin, isUser, verifyToken } from '../../core/middlewares';
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

    const orderProducts = await this.orderProductService.getOrderProducts(req.query, req.headers.authorization!);

    resp.json(orderProducts);
  }

  @Get(':id')
  @Middleware([verifyToken, isUser])
  async getOrderProduct(req: Request, resp: Response) {
    const { id } = req.params;
    const orderProduct = await this.orderProductService.getOrderProduct(id, req.headers.authorization!);

    resp.json(orderProduct);
  }

  // @Put(':id')
  // async updateOrderProduct(req: Request, resp: Response) {
  //   const { id } = req.params;
  //   const orderProduct = await this.orderProductService.updateOrderProduct(id, req.body);

  //   resp.json(orderProduct);
  // }

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

  // @Delete(':id')
  // @Middleware([verifyToken, isAdmin])
  // async removeOrderProduct(req: Request, resp: Response) {
  //   const { id } = req.params;
  //   const removed = await this.orderProductService.removeOrderProduct(id);

  //   resp.status(HttpStatus.OK).json(removed);
  // }
}
