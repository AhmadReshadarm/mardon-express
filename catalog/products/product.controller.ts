import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { ProductService } from './product.service';
import { Product, Tag } from '../../core/entities';
import { TagService } from '../tags/tag.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, verifyToken } from '../../core/middlewares';
import { create } from 'xmlbuilder2';
@singleton()
@Controller('/products')
export class ProductController {
  constructor(private productService: ProductService, private tagService: TagService) {}

  @Get()
  async getProducts(req: Request, resp: Response) {
    try {
      const products = await this.productService.getProducts(req.query);
      resp.json(products);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }
  @Get('google')
  async getProductsGoogle(req: Request, resp: Response) {
    try {
      const products = await this.productService.getProducts({ limit: 100000 });

      const item = products.rows.map((product: any) => {
        return {
          'g:id': `${product?.productVariants![0]?.artical}`,
          'g:title': `${product.name}`,
          'g:description': `${product.desc}`,
          'g:link': `https://nbhoz.ru/product/${product.url}`,
          'g:image_link': `https://nbhoz.ru/api/images/${product?.productVariants![0]?.images?.split(', ')[0]}`,
          'g:condition': 'new',
          'g:availability': 'in stock',
          'g:price': `${product?.productVariants![0]?.price}.00 RUB`,
          'g:google_product_category': `${product.category?.parent?.name} > ${product.category?.name}`,
          // 'g:additional_image_link': `https://nbhoz.ru/api/images/${
          //   product?.productVariants![0]?.images?.split(', ')[
          //     product?.productVariants![0]?.images?.split(', ').length - 1
          //   ]
          // }`,
        };
      });

      const payload = {
        rss: {
          '@xmlns:g': 'http://base.google.com/ns/1.0',
          '@version': '2.0',
          'channel': {
            title: 'NBHOZ - интернет магазин хозтовары оптом. по выгодным ценам',
            link: 'https://nbhoz.ru',
            description:
              'NBHOZ, Дешевые хозтовары оптом в интернет магазине nbhoz в Москве и все Россия, купить Кухонная утварь, Товары для сервировки стола, Уборочный инвентарь, Товары для ванной комнаты, Прихожая, Товары для ремонта, Товары для дачи и сада, Спортивные и туристические товары, Бытовая техника, Товары для животных, Декор для дома',
            item,
          },
        },
      };
      const root = create(payload);

      const xml = root.end({ prettyPrint: true });
      resp.setHeader('Content-Type', 'text/xml');
      resp.send(xml);
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
      const created = await this.productService.createProduct(newProduct);

      resp.status(HttpStatus.CREATED).json({ id: created.id });
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateProduct(req: Request, resp: Response) {
    const { id } = req.params;
    const { tags } = req.body;
    try {
      const newProduct = new Product(req.body);

      tags ? (newProduct.tags = await this.tagService.getTagsByIds(tags.map((tag: Tag) => String(tag)))) : null;

      const updated = await this.productService.updateProduct(id, newProduct);

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
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
