import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { Address } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { AddressService } from './address.service';
import { isAdmin, isUser, verifyToken } from '../../core/middlewares';
import { Role } from '../../core/enums/roles.enum';

@singleton()
@Controller('/addresses')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get()
  @Middleware([verifyToken, isUser])
  async getAddresses(req: Request, resp: Response) {
    if (resp.locals.user.role !== Role.Admin) {
      req.query.userId = String(resp.locals.user.id);
    }

    const addresses = await this.addressService.getAddresses(req.query as any, req.headers.authorization!);

    resp.json(addresses);
  }

  @Get(':id')
  @Middleware([verifyToken, isUser])
  async getAddress(req: Request, resp: Response) {
    const { id } = req.params;
    const address = await this.addressService.getAddress(id, req.headers.authorization!);

    resp.json(address);
  }

  @Post()
  @Middleware([verifyToken, isUser])
  async createAddress(req: Request, resp: Response) {
    const newAddress = new Address(req.body);
    newAddress.userId = resp.locals.user.id;

    await validation(newAddress);
    const created = await this.addressService.createAddress(newAddress);

    resp.status(HttpStatus.CREATED).json(created);
  }

  @Post('direct')
  @Middleware([verifyToken, isAdmin])
  async createAddressDirect(req: Request, resp: Response) {
    const newAddress = new Address(req.body);

    await validation(newAddress);
    const created = await this.addressService.createAddress(newAddress);

    resp.status(HttpStatus.CREATED).json(created);
  }

  @Put(':id')
  @Middleware([verifyToken, isUser])
  async updateAddress(req: Request, resp: Response) {
    const { id } = req.params;
    const updated = await this.addressService.updateAddress(id, req.body, resp.locals.user);

    resp.status(HttpStatus.OK).json(updated);
  }

  @Delete(':id')
  @Middleware([verifyToken, isUser])
  async removeAddress(req: Request, resp: Response) {
    const { id } = req.params;
    const removed = await this.addressService.removeAddress(id, resp.locals.user);

    resp.status(HttpStatus.OK).json(removed);
  }
}
