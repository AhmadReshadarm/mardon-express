import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { ParameterService } from './parameter.service';
import { isAdmin, verifyToken } from '../../core/middlewares';

@singleton()
@Controller('/parameters')
export class ParameterController {
  constructor(private parameterService: ParameterService) {}

  @Get()
  async getParameters(req: Request, resp: Response) {
    const parameters = await this.parameterService.getParameters(req.query);

    resp.json(parameters);
  }

  @Get(':id')
  async getParameter(req: Request, resp: Response) {
    const { id } = req.params;
    const parameter = await this.parameterService.getParameter(id);

    resp.json(parameter);
  }

  @Post()
  @Middleware([verifyToken, isAdmin])
  async createParameter(req: Request, resp: Response) {
    const created = await this.parameterService.createParameter(req.body);

    resp.status(HttpStatus.CREATED).json({ id: created.id });
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateParameter(req: Request, resp: Response) {
    const { id } = req.params;
    const updated = await this.parameterService.updateParameter(id, req.body);

    resp.status(HttpStatus.OK).json(updated);
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeParameter(req: Request, resp: Response) {
    const { id } = req.params;
    const removed = await this.parameterService.removeParameter(id);

    resp.status(HttpStatus.OK).json(removed);
  }
}
