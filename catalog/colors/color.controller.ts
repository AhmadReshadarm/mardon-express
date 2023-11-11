import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { ColorService } from './color.service';
import { isAdmin, verifyToken } from '../../core/middlewares';
import { ProductService } from '../products/product.service';

@singleton()
@Controller('/colors')
export class ColorController {
  constructor(
    private colorService: ColorService,
    private productService: ProductService,
  ) {}

  @Get()
  async getColors(req: Request, resp: Response) {
    try {
      const colors = await this.colorService.getColors(req.query as any);

      resp.json(colors);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Get(':id')
  async getColor(req: Request, resp: Response) {
    try {
      const { id } = req.params;
      const color = await this.colorService.getColor(id);

      resp.json(color);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Post()
  @Middleware([verifyToken, isAdmin])
  async createColor(req: Request, resp: Response) {
    try {
      const created = await this.colorService.createColor(req.body);

      resp.status(HttpStatus.CREATED).json({ id: created.id });
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateColor(req: Request, resp: Response) {
    try {
      const { id } = req.params;
      const updated = await this.colorService.updateColor(id, req.body);

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeColor(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const color = await this.colorService.getColorsByIds([id]);
      const hasData = await this.productService.getProducts({ color: color[0].url });

      if (hasData.length > 0) {
        resp.status(HttpStatus.FORBIDDEN).json(hasData);
        return;
      }

      const removed = await this.colorService.removeColor(id);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }
}
