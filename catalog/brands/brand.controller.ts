import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { BrandService } from './brand.service';
import { ProductService } from '../products/product.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, verifyToken } from '../../core/middlewares';

@singleton()
@Controller('/brands')
export class BrandController {
  constructor(
    private brandService: BrandService,
    private productService: ProductService,
  ) {}

  @Get()
  async getBrands(req: Request, resp: Response) {
    const brands = await this.brandService.getBrands(req.query);

    resp.json(brands);
  }

  @Get(':id')
  async getBrand(req: Request, resp: Response) {
    const { id } = req.params;
    const brand = await this.brandService.getBrand(id);

    resp.json(brand);
  }

  @Post('')
  @Middleware([verifyToken, isAdmin])
  async createBrand(req: Request, resp: Response) {
    const created = await this.brandService.createBrand(req.body);

    resp.status(HttpStatus.CREATED).json({ id: created.id });
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateBrand(req: Request, resp: Response) {
    const { id } = req.params;
    const updated = await this.brandService.updateBrand(id, req.body);

    resp.status(HttpStatus.OK).json(updated);
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeBrand(req: Request, resp: Response) {
    const { id } = req.params;
    const brand = await this.brandService.getBrand(id);

    const hasData = await this.productService.getProducts({ brand: brand.url });

    if (hasData.length > 0) {
      resp.status(HttpStatus.FORBIDDEN).json(hasData);
      return;
    }

    const removed = await this.brandService.removeBrand(id);

    resp.status(HttpStatus.OK).json(removed);
  }
}
