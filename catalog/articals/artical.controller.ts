import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { ArticalService } from './artical.service';
import { isAdmin, verifyToken } from '../../core/middlewares';
import { ProductService } from '../products/product.service';

@singleton()
@Controller('/articals')
export class ArticalController {
  constructor(private articalService: ArticalService, private productService: ProductService) {}

  @Get()
  async getArticals(req: Request, resp: Response) {
    try {
      const articals = await this.articalService.getArticals(req.query as any);

      resp.status(HttpStatus.OK).json(articals);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get(':id')
  async getArtical(req: Request, resp: Response) {
    try {
      const { id } = req.params;
      const artical = await this.articalService.getArtical(id);

      resp.status(HttpStatus.OK).json(artical);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post()
  @Middleware([verifyToken, isAdmin])
  async createArtical(req: Request, resp: Response) {
    try {
      const created = await this.articalService.createArtical(req.body);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateArtical(req: Request, resp: Response) {
    try {
      const { id } = req.params;
      const updated = await this.articalService.updateArtical(id, req.body);

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeArtical(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const color = await this.articalService.getArticalsByIds([id]);
      const hasData = await this.productService.getProducts({ color: color[0].url });

      if (hasData.length > 0) {
        resp.status(HttpStatus.FORBIDDEN).json(hasData);
        return;
      }

      const removed = await this.articalService.removeArtical(id);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
