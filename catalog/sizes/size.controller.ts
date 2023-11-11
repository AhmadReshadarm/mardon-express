import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { SizeService } from './size.service';
import { isAdmin, verifyToken } from '../../core/middlewares';
import { ProductService } from '../products/product.service';
@singleton()
@Controller('/sizes')
export class SizeController {
  constructor(
    private sizeService: SizeService,
    private productService: ProductService,
  ) {}

  @Get()
  async getSizes(req: Request, resp: Response) {
    const sizes = await this.sizeService.getSizes(req.query as any);

    resp.json(sizes);
  }

  @Get(':id')
  async getSize(req: Request, resp: Response) {
    const { id } = req.params;
    const size = await this.sizeService.getSize(id);

    resp.json(size);
  }

  @Post()
  @Middleware([verifyToken, isAdmin])
  async createSize(req: Request, resp: Response) {
    const created = await this.sizeService.createSize(req.body);

    resp.status(HttpStatus.CREATED).json({ id: created.id });
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateSize(req: Request, resp: Response) {
    const { id } = req.params;
    const updated = await this.sizeService.updateSize(id, req.body);

    resp.status(HttpStatus.OK).json(updated);
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeSize(req: Request, resp: Response) {
    const { id } = req.params;
    const size = await this.sizeService.getSizesByIds([id]);
    const hasData = await this.productService.getProducts({ size: size[0].url });
    if (hasData.length > 0) {
      resp.status(HttpStatus.FORBIDDEN).json(hasData);
      return;
    }
    const removed = await this.sizeService.removeSize(id);

    resp.status(HttpStatus.OK).json(removed);
  }
}
