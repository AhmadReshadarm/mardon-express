import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import {} from '../../core/lib/error.handlers';
import { HttpStatus } from '../../core/lib/http-status';
import { TagService } from './tag.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, verifyToken } from '../../core/middlewares';
import { ProductService } from '../products/product.service';
@singleton()
@Controller('/tags')
export class TagController {
  constructor(
    private tagService: TagService,
    private productService: ProductService,
  ) {}

  @Get()
  async getTags(req: Request, resp: Response) {
    try {
      const tags = await this.tagService.getTags(req.query);

      resp.json(tags);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get(':id')
  async getTag(req: Request, resp: Response) {
    const { id } = req.params;
    const tag = await this.tagService.getTag(id);

    resp.json(tag);
  }

  @Post('')
  @Middleware([verifyToken, isAdmin])
  async createTag(req: Request, resp: Response) {
    const created = await this.tagService.createTag(req.body);

    resp.status(HttpStatus.CREATED).json({ id: created.id });
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateTag(req: Request, resp: Response) {
    const { id } = req.params;
    const updated = await this.tagService.updateTag(id, req.body);

    resp.status(HttpStatus.OK).json(updated);
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeTag(req: Request, resp: Response) {
    const { id } = req.params;
    const tag = await this.tagService.getTagsByIds([id]);
    const hasData = await this.productService.getProducts({ tag: tag[0].url });
    if (hasData.length > 0) {
      resp.status(HttpStatus.FORBIDDEN).json(hasData);
      return;
    }
    const removed = await this.tagService.removeTag(id);

    resp.status(HttpStatus.OK).json(removed);
  }
}
