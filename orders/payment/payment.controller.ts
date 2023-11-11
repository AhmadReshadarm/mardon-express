import { IGetPaymentList, ICreateRefund, YooCheckout } from '@a2seven/yoo-checkout';
import { isAdmin, isUser, verifyToken, verifyUserId } from '../../core/middlewares';
import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { v4 } from 'uuid';
import { Controller, Delete, Get, Middleware, Post } from '../../core/decorators';
import { HttpStatus } from '../../core/lib/http-status';
import { CheckoutService } from '../checkout/checkout.service';
const { SHOP_ID, SHOP_SEECRET_KEY } = process.env;

@singleton()
@Controller('/payments')
export class PaymentController {
  constructor(private checkoutService: CheckoutService) {}
  @Get(':id')
  @Middleware([verifyToken, isUser])
  async getPayment(req: Request, resp: Response) {
    const { id } = req.params;

    const checkout = new YooCheckout({
      shopId: SHOP_ID!,
      secretKey: SHOP_SEECRET_KEY!,
    });

    try {
      const payment = await checkout.getPayment(id);
      resp.status(HttpStatus.OK).json(payment);
    } catch (error: any) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.response.data });
    }
  }

  @Get()
  @Middleware([verifyToken, isAdmin])
  async getPayments(req: Request, resp: Response) {
    const checkout = new YooCheckout({
      shopId: SHOP_ID!,
      secretKey: SHOP_SEECRET_KEY!,
    });
    const filters: IGetPaymentList = { limit: 100 };

    try {
      const paymentList = await checkout.getPaymentList(filters);
      resp.status(HttpStatus.CREATED).json(paymentList);
    } catch (error: any) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.response.data });
    }
  }

  @Post()
  @Middleware([verifyToken, isUser])
  async createPayment(req: Request, resp: Response) {
    const checkout = new YooCheckout({
      shopId: SHOP_ID!,
      secretKey: SHOP_SEECRET_KEY!,
    });
    const idempotenceKey = v4();

    const createPayload: any = {
      amount: {
        value: req.body.value,
        currency: 'RUB',
      },
      confirmation: {
        type: 'embedded',
      },
      capture: true,
      description: 'Заказ №72',
    };

    try {
      const payment = await checkout.createPayment(createPayload, idempotenceKey);
      resp.status(HttpStatus.CREATED).json(payment);
    } catch (error: any) {
      resp.status(HttpStatus.CONFLICT).json({ error: error.response.data });
    }
  }

  @Delete('')
  @Middleware([verifyToken, isUser])
  async removePayment(req: Request, resp: Response) {
    const { paymentId } = req.body;
    const checkoutsByPaymentId = await this.checkoutService.getCheckoutByPaymentId(
      paymentId,
      req.headers.authorization!,
    );
    if (!checkoutsByPaymentId) {
      resp.status(HttpStatus.FORBIDDEN).json({ message: 'Not allowed!' });
      return;
    }
    const timeCheck = (orderDate: any) => {
      const oneDay = 24 * 60 * 60 * 1000;
      const currentDate = new Date().getTime();
      const dateOnDB = new Date(orderDate).getTime() + oneDay;
      return currentDate >= dateOnDB;
    };

    if (timeCheck(checkoutsByPaymentId.createdAt)) {
      resp.status(HttpStatus.REQUEST_TIMEOUT).json({ message: 'request timedout' });
      return;
    }

    // const checkout = new YooCheckout({
    //   shopId: SHOP_ID!,
    //   secretKey: SHOP_SEECRET_KEY!,
    // });
    // const idempotenceKey = v4();

    // const createRefundPayload: ICreateRefund = {
    //   payment_id: checkoutsByPaymentId.paymentId!,
    //   amount: {
    //     value: `${checkoutsByPaymentId.totalAmount}`,
    //     currency: 'RUB',
    //   },
    // };

    try {
      await this.checkoutService.removeCheckout(checkoutsByPaymentId.id, resp.locals.user);
      // const refund = await checkout.createRefund(createRefundPayload, idempotenceKey);
      resp.status(HttpStatus.CREATED).json('ok');
    } catch (error: any) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.response.data });
    }
  }
}
