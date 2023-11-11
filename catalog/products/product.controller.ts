import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { ProductService } from './product.service';
import { Color, Product, Size, Tag } from '../../core/entities';
import { TagService } from '../tags/tag.service';
import { SizeService } from '../sizes/size.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, verifyToken } from '../../core/middlewares';

@singleton()
@Controller('/products')
export class ProductController {
  constructor(
    private productService: ProductService,
    private tagService: TagService,
    private sizeService: SizeService,
  ) {}

  @Get()
  async getProducts(req: Request, resp: Response) {
    try {
      const products = await this.productService.getProducts(req.query);
      resp.json(products);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get('priceRange')
  async getProductsPriceRange(req: Request, resp: Response) {
    try {
      const products = await this.productService.getProductsPriceRange(req.query);

      resp.json(products);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get('by-url/:url')
  async getProductByUrl(req: Request, resp: Response) {
    const { url } = req.params;
    try {
      const product = await this.productService.getProductByUrl(url);

      resp.json(product);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get('productsUnderOneThousand')
  async getProductsUnderOneThousand(req: Request, resp: Response) {
    try {
      const products = await this.productService.getProducts({ tags: ['UnderOneThousand'] });

      resp.json(products);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get(':id')
  async getProduct(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const product = await this.productService.getProduct(id);

      resp.json(product);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Post()
  @Middleware([verifyToken, isAdmin])
  async createProduct(req: Request, resp: Response) {
    const { tags, sizes } = req.body;
    try {
      const newProduct = await validation(new Product(req.body));

      tags ? (newProduct.tags = await this.tagService.getTagsByIds(tags.map((tag: Tag) => String(tag)))) : null;
      sizes ? (newProduct.sizes = await this.sizeService.getSizesByIds(sizes.map((size: Size) => String(size)))) : null;
      const created = await this.productService.createProduct(newProduct);

      resp.status(HttpStatus.CREATED).json({ id: created.id });
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateProduct(req: Request, resp: Response) {
    const { id } = req.params;
    const { tags, sizes } = req.body;
    try {
      const newProduct = new Product(req.body);

      tags ? (newProduct.tags = await this.tagService.getTagsByIds(tags.map((tag: Tag) => String(tag)))) : null;
      sizes ? (newProduct.sizes = await this.sizeService.getSizesByIds(sizes.map((size: Size) => String(size)))) : null;

      const updated = await this.productService.updateProduct(id, newProduct);

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeProduct(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const removed = await this.productService.removeProduct(id);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }
}
