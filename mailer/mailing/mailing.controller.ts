import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { MailingService } from './mailing.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, verifyToken } from '../../core/middlewares';
import { Mailing } from '../../core/entities';
import { validate } from 'class-validator';
import { MailOptionsDTO } from '../mailer.dtos';
import { SubsribeService } from '../subscribe/subsribe.service';

@singleton()
@Controller('/mailings')
export class MailingController {
  constructor(
    private mailingService: MailingService,
    private subscribeService: SubsribeService,
  ) {}

  @Get()
  @Middleware([verifyToken, isAdmin])
  async getMailings(req: Request, resp: Response) {
    const mailing = await this.mailingService.getMailings();

    resp.json(mailing);
  }

  @Get(':id')
  @Middleware([verifyToken, isAdmin])
  async getMailing(req: Request, resp: Response) {
    const { id } = req.params;
    const mailing = await this.mailingService.getMailing(id);

    resp.json(mailing);
  }

  @Post('')
  @Middleware([verifyToken, isAdmin])
  async createMailing(req: Request, resp: Response) {
    const newMailing = new Mailing(req.body);
    await validate(newMailing);

    const created = await this.mailingService.createMailing(newMailing);

    resp.status(HttpStatus.CREATED).json({ id: created.id });
  }

  @Post('sendmail')
  @Middleware([verifyToken, isAdmin])
  async sendMail(req: Request, resp: Response) {
    const result = await this.mailingService.sendMail(req.body);

    resp.status(result!.status).json(result!.response);
  }

  @Post('send-all')
  @Middleware([verifyToken, isAdmin])
  async sendToAllSubscribers(req: Request, resp: Response) {
    const { mailingId } = req.body;
    const subscribers = await this.subscribeService.getSubscribers();

    const result = await this.mailingService.sendToAllSubscribers(mailingId, subscribers);

    resp.status(result.status).json(result.response);
  }

  @Post('send-selected')
  @Middleware([verifyToken, isAdmin])
  async sendToSelectedSubscribers(req: Request, resp: Response) {
    const { mailingId, subscribers } = req.body;
    const result = await this.mailingService.sendToSelectedSubscribers(mailingId, subscribers);
    resp.status(result.status).json(result.response);
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateAdvertisement(req: Request, resp: Response) {
    const { id } = req.params;
    await validate(req.body);

    const updated = await this.mailingService.updateMailing(id, req.body);

    resp.status(HttpStatus.OK).json(updated);
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeMailing(req: Request, resp: Response) {
    const { id } = req.params;
    const removed = await this.mailingService.removeMailing(id);

    resp.status(HttpStatus.OK).json(removed);
  }
}
