import webpush from 'web-push';
import { Role } from '../../core/enums/roles.enum';
import { Request, Response, NextFunction } from 'express';
import { singleton } from 'tsyringe';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Checkout, Parameter, Subscription } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { isAdmin, isUser, verifyToken } from '../../core/middlewares';
import { generateInvoiceTemplet } from '../../orders/functions/createInvoice';
import { sendInvoice } from '../../orders/functions/send.mail';
import { CheckoutService } from './checkout.service';
import { invoiceTamplate } from '../functions/invoice.tamplate';

@singleton()
@Controller('/checkouts')
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  @Get()
  @Middleware([verifyToken, isUser])
  async getCheckouts(req: Request, resp: Response) {
    // if (resp.locals.user.role !== Role.Admin) {
    //   req.query.userId = String(resp.locals.user.id);
    // }
    try {
      const { jwt } = resp.locals;

      const checkouts = await this.checkoutService.getCheckouts(req.query, req.headers.authorization!, jwt.id);

      resp.status(HttpStatus.OK).json(checkouts);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('all')
  @Middleware([verifyToken, isAdmin])
  async getAllCheckouts(req: Request, resp: Response) {
    try {
      const checkouts = await this.checkoutService.getAllCheckouts(req.query, req.headers.authorization!);

      resp.json(checkouts);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Get(':id')
  @Middleware([verifyToken, isAdmin])
  async getCheckout(req: Request, resp: Response) {
    const { id } = req.params;
    const checkout = await this.checkoutService.getCheckout(id, req.headers.authorization!);

    resp.json(checkout);
  }

  @Post()
  @Middleware([verifyToken, isUser])
  async createCheckout(req: Request, resp: Response) {
    const checkoutPayload = {
      ...req.body,
    };
    checkoutPayload.basket = req.body.basket.id;
    const newCheckout = new Checkout(checkoutPayload);
    const { user } = resp.locals;
    if (user.role !== Role.Admin) {
      newCheckout.userId = user.id;
    }

    let created: any;

    try {
      await validation(newCheckout);
      created = await this.checkoutService.createCheckout(newCheckout);
      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
    try {
      const payload = {
        receiverName: req.body.address.receiverName,
        receiverPhone: req.body.address.receiverPhone,
        receiverEmail: user.role !== Role.Admin ? user.email : req.body.address.receiverEmail,
        address: req.body.address.address,
        roomOrOffice: req.body.address.roomOrOffice,
        door: req.body.address.door,
        floor: req.body.address.floor,
        rignBell: req.body.address.rignBell,
        zipCode: req.body.address.zipCode,
        comment: req.body.comment,
        cart: req.body.basket,
      };
      const invoiceData: string = generateInvoiceTemplet(payload);

      const emailAdminPayload = {
        to: `info@nbhoz.ru`,
        subject: `Заказ № ${created.id} на nbhoz.ru`,
        html: invoiceData,
      };
      await this.checkoutService.sendMail(emailAdminPayload);

      const emailAdminPayload_2 = {
        to: `armaan0080@yahoo.com`,
        subject: `Заказ № ${created.id} на nbhoz.ru`,
        html: invoiceData,
      };
      await this.checkoutService.sendMail(emailAdminPayload_2);

      const emailUserPayload = {
        to: user.role !== Role.Admin ? user.email : req.body.address.receiverEmail,
        subject: `Заказ № ${created.id} на nbhoz.ru`,
        html: invoiceData,
      };
      await this.checkoutService.sendMail(emailUserPayload);
    } catch (error) {
      console.log(error);
    }
  }

  @Post('direct')
  async checkoutWithoutRegister(req: Request, resp: Response) {
    let result;
    let adminResult;
    try {
      result = await this.checkoutService.sendMail(req.body);
      resp.status(result!.status).json(result!.response);
    } catch (error) {
      resp.status(HttpStatus.CREATED).json(result);
    }
    try {
      const payload = {
        to: 'info@nbhoz.ru',
        subject: req.body.subject,
        html: req.body.html,
      };
      adminResult = await this.checkoutService.sendMail(payload);
      payload.to = 'armaan0080@yahoo.com';
      adminResult = await this.checkoutService.sendMail(payload);
      payload.to = 'exelon@hoz-mardon.ru';
      adminResult = await this.checkoutService.sendMail(payload);
    } catch (error) {
      console.log(adminResult);
    }
  }

  @Post('subscribe')
  @Middleware([verifyToken, isAdmin])
  async createSubscriber(req: Request, resp: Response, next: NextFunction) {
    try {
      const subscrition = await this.checkoutService.getSubscribers();
      if (subscrition && subscrition.length !== 0) {
        for (let i = 0; i < subscrition.length; i++) {
          if (subscrition[i].subscriber === req.body.subscriber) {
            resp.status(HttpStatus.ACCEPTED).json({ message: 'Your are all set' });
            return;
          }
        }
      }
    } catch (error) {
      next();
    }

    try {
      const newSubscrition = await validation(new Subscription({ subscriber: req.body.subscriber }));
      const created = await this.checkoutService.createSubscriber(newSubscrition);
      resp.status(HttpStatus.OK).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Put('refreshpushsubscription')
  @Middleware([verifyToken, isAdmin])
  async updatedSubscriber(req: Request, resp: Response) {
    try {
      const updated = await this.checkoutService.updateSubscriber(JSON.stringify(req.body.oldSubscription), {
        id: '',
        subscriber: JSON.stringify(req.body.newSubscription),
      });
      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isUser])
  async updateCheckout(req: Request, resp: Response) {
    const { id } = req.params;
    const { jwt } = resp.locals;
    try {
      const checkoutsById = await this.checkoutService.getCheckout(id, req.headers.authorization!);
      if (!checkoutsById) {
        resp.status(HttpStatus.NOT_FOUND).json({ message: 'Not found!' });
        return;
      }
      const timeCheck = (orderDate: any) => {
        const oneDay = 24 * 60 * 60 * 1000;
        const currentDate = new Date().getTime();
        const dateOnDB = new Date(orderDate).getTime() + oneDay;
        return currentDate >= dateOnDB;
      };

      if (timeCheck(checkoutsById.createdAt) && jwt.role !== Role.Admin) {
        resp.status(HttpStatus.REQUEST_TIMEOUT).json({ message: 'request timedout' });
        return;
      }
      if (jwt.role !== Role.Admin) {
        req.body.sattus = checkoutsById.status;
        const userCheckoutUpdated = await this.checkoutService.updateCheckout(id, req.body, resp.locals.user);
        resp.status(HttpStatus.OK).json(userCheckoutUpdated);
        return;
      }
      const updated = await this.checkoutService.updateCheckout(id, req.body, resp.locals.user);

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeCheckout(req: Request, resp: Response) {
    try {
      const { id } = req.params;
      const removed = await this.checkoutService.removeCheckout(id, resp.locals.user);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
