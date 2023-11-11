import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { SlideService } from './slide.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, verifyToken } from '../../core/middlewares';

@singleton()
@Controller('/slides')
export class SlideController {
  constructor(private slideService: SlideService) {}

  @Get()
  async getSlides(req: Request, resp: Response) {
    try {
      const slides = await this.slideService.getSlides();

      resp.json(slides);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Get(':id')
  async getSlide(req: Request, resp: Response) {
    const { id } = req.params;
    const slide = await this.slideService.getSlide(id);

    resp.json(slide);
  }

  @Post('')
  @Middleware([verifyToken, isAdmin])
  async createSlide(req: Request, resp: Response) {
    try {
      const created = await this.slideService.createSlide(req.body);

      resp.status(HttpStatus.CREATED).json({ id: created.id });
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Put()
  @Middleware([verifyToken, isAdmin])
  async updateSlides(req: Request, resp: Response) {
    const slides = await this.slideService.updateSlides(req.body);

    resp.status(HttpStatus.CREATED).json({ slides });
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeSlide(req: Request, resp: Response) {
    const { id } = req.params;
    const removed = await this.slideService.removeSlide(id);

    resp.status(HttpStatus.OK).json(removed);
  }
}
