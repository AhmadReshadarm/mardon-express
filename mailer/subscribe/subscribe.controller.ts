import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { SubsribeService } from './subsribe.service';
import { Controller, Delete, Get, Middleware, Post } from '../../core/decorators';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { Subscribe } from '../../core/entities';
import { isAdmin, isUser, verifyToken } from '../../core/middlewares';
import { MailingService } from '../mailing/mailing.service';
import { sendAdminEmailToCallLimiter } from '../rate.limite';

@singleton()
@Controller('/subscribes')
export class SubscribeController {
  constructor(private mailingService: MailingService, private subscribeService: SubsribeService) {}

  @Get()
  @Middleware([verifyToken, isAdmin])
  async getSubscribers(req: Request, resp: Response) {
    try {
      const subscribes = await this.subscribeService.getSubscribers();

      resp.status(HttpStatus.OK).json(subscribes);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  // @Get('files')
  // @Middleware([verifyToken, isAdmin])
  // async downloadSubscribers(req: Request, resp: Response) {
  //   try {
  //     const subscribes = await this.subscribeService.getSubscribers();

  //     let workBook = new ExcelJs.Workbook();
  //     const sheet = workBook.addWorksheet('subscribers');
  //     sheet.columns = [
  //       { header: 'ID', key: 'id', width: 10 },
  //       { header: 'Имя', key: 'name', width: 30 },
  //       { header: 'Электронная почта', key: 'email', width: 50 },
  //     ];

  //     await subscribes.map((subscriber, index) => {
  //       sheet.addRow({
  //         id: subscriber.id,
  //         name: subscriber.name,
  //         email: subscriber.email,
  //       });
  //     });
  //     resp.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  //     resp.setHeader('Content-Disposition', 'attachment;filename=' + 'subscribers.xlsx');
  //     workBook.xlsx.write(resp);
  //     // workBook.xlsx.writeBuffer().then();

  //     // let tempFilePath = tempfile({ extension: '.xlsx' });
  //     // workBook.xlsx
  //     //   .writeFile('subscribers.xlsx')
  //     //   .then(response => {
  //     //     resp.sendFile(path.join(__dirname, '../subscribers.xlsx'));
  //     //   })
  //     //   .catch(error => {
  //     //     console.log(error);
  //     //   });
  //   } catch (error) {
  //     resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
  //   }
  // }

  @Get(':mail')
  @Middleware([verifyToken, isUser])
  async getSubscriberById(req: Request, resp: Response) {
    const { mail } = req.params;
    try {
      const subscriber = await this.subscribeService.getSubscriberByEmail(mail);

      resp.status(HttpStatus.OK).json(subscriber);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post('')
  async subscribe(req: Request, resp: Response) {
    try {
      const subscriber = await this.subscribeService.getSubscriberByEmail(req.body.email);
      if (subscriber) {
        resp.status(HttpStatus.CONFLICT).json('already subscribed!');
        return;
      }
      const newSubscribe = new Subscribe(req.body);
      await validation(newSubscribe);

      const created = await this.subscribeService.createSubscribe(newSubscribe);
      resp.status(HttpStatus.OK).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post('call')
  @Middleware([sendAdminEmailToCallLimiter])
  async sendAdminEmailToCall(req: Request, resp: Response) {
    let result;
    try {
      result = await this.mailingService.sendMail(req.body);

      resp.status(result!.status).json(result!.response);
    } catch (error) {
      resp.status(HttpStatus.CREATED).json(result);
    }
    try {
      req.body.to = 'armaan0080@yahoo.com';
      await this.mailingService.sendMail(req.body);
    } catch (error) {
      console.log(error);
    }
  }

  @Delete(':mail')
  @Middleware([verifyToken, isUser])
  async unsubscribe(req: Request, resp: Response) {
    const { mail } = req.params;
    try {
      const removed = await this.subscribeService.removeSubscribe(mail);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
