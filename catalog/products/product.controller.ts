import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { ProductService } from './product.service';
import { Category, Product, Tag } from '../../core/entities';
import { TagService } from '../tags/tag.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, verifyToken } from '../../core/middlewares';
import { create } from 'xmlbuilder2';
import { CategoryService } from '../../catalog/categories/category.service';
import * as fs from 'fs';

@singleton()
@Controller('/products')
export class ProductController {
  constructor(
    private productService: ProductService,
    private tagService: TagService,
    private categoryService: CategoryService,
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

  // getProductVariantsImages(productVariants?: ProductVariant[]) {
  //   let images: string[] = [];
  //   productVariants?.forEach(variant => {
  //     const variantImages = variant.images ? variant.images.split(', ') : [];
  //     images = images.concat(variantImages);
  //   });
  //   return images;
  // }

  @Get('google')
  async getProductsGoogle(req: Request, resp: Response) {
    try {
      const products: any = await this.productService.getProducts({ limit: 100000 });
      const filtered = products.rows.filter((product: any) => product?.productVariants![0]?.price !== 1);

      // const getProductVariantsImages = (productVariants?: ProductVariant[]) => {
      //   let images: string[] = [];
      //   productVariants?.forEach(variant => {
      //     const variantImages = variant.images ? variant.images.split(', ') : [];
      //     images = images.concat(variantImages);
      //   });
      //   return images;
      // };

      const item = filtered.map((product: any) => {
        const images = this.productService.getProductVariantsImages(product.productVariants);
        const addetinalImages = images.map(image => `https://nbhoz.ru/api/images/${image}`);
        return {
          'g:id': `${product?.productVariants![0]?.artical}`,
          'g:title': `${product.name}`,
          'g:description': `${product?.desc?.includes('|') ? product.desc.split('|')[1] : product.desc}`,
          'g:link': `https://nbhoz.ru/product/${product.url}`,
          'g:image_link': `https://nbhoz.ru/api/images/${product?.productVariants![0]?.images?.split(', ')[0]}`,
          'g:condition': 'new',
          'g:availability': 'in stock',
          'g:price': `${product?.productVariants![0]?.price}.00 RUB`,
          'g:google_product_category': `${product.category?.parent?.name} > ${product.category?.name}`,
          'g:additional_image_link': addetinalImages,
          'g:rating': product?.rating?.avg,
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

      const opts = {
        encoding: 'utf-8',
      };

      const root = create(opts, payload);

      const xml = root.end({ prettyPrint: true });
      resp.setHeader('Content-Type', 'text/xml');
      resp.send(xml);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get('yandex')
  async getProductsYandex(req: Request, resp: Response) {
    try {
      const products: any = await this.productService.getProducts({ limit: 100000 });
      const filtered = products.rows.filter((product: any) => product?.productVariants![0]?.price !== 1);
      const categoriesTree = await this.categoryService.getCategories({ limit: 1000 });
      const filteredCategoriesTree: Category[] = [];
      categoriesTree.rows.map(category => {
        if (category.parent === null) {
          filteredCategoriesTree.push(category);
        }
      });

      const categoryArray: any = [];
      filteredCategoriesTree.map(category => {
        categoryArray.push({
          '@id': category.id,
          '#': category.name,
        });
        category.children.map(childCategory => {
          categoryArray.push({ '@id': childCategory.id, '@parentId': category.id, '#': childCategory.name });
        });
      });

      const offer = filtered.map((product: any) => {
        const images = this.productService.getProductVariantsImages(product.productVariants);
        const picture: any = [];
        images.map(image => {
          picture.push({ '#': `https://nbhoz.ru/api/images/${image}` });
        });
        return {
          '@id': product?.id,
          'name': product?.name,
          'url': `https://nbhoz.ru/product/${product?.url}`,
          'price': product?.productVariants[0]?.price,
          'currencyId': 'RUR',
          'categoryId': product?.category?.id,
          // 'picture': `https://nbhoz.ru/api/images/${product?.productVariants![0]?.images?.split(', ')[0]}`,
          picture,
          'description': product?.desc?.includes('|') ? product?.desc.split('|')[1] : product?.desc,
          'rating': product?.rating?.avg,
        };
      });
      const currentDate = new Date();
      const payload = {
        yml_catalog: {
          '@date': `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()} ${currentDate.getHours()}:${currentDate.getMinutes()}`,
          'shop': {
            name: 'NBHOZ - интернет магазин хозтовары оптом. по выгодным ценам',
            company: 'NBHOZ',
            url: 'https://nbhoz.ru',
            version: '1.0',
            email: 'info@nbhoz.ru',
            currencies: {
              currency: 'RUR',
              rate: '1',
            },
            categories: {
              category: categoryArray,
            },
            offers: {
              offer,
            },
          },
        },
      };
      const opts = {
        encoding: 'utf-8',
      };

      const root = create(opts, payload);

      const xml = root.end({ prettyPrint: true });
      resp.setHeader('Content-Type', 'text/xml');
      resp.send(xml);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get('yandex-webmaster')
  async getProductsYandexWebMaster(req: Request, resp: Response) {
    try {
      const products: any = await this.productService.getProducts({ limit: 100000 });
      const parameters = await this.productService.getParameters({ limit: 1000 });
      const filtered = products.rows.filter((product: any) => product?.productVariants![0]?.price !== 1);
      const categoriesTree = await this.categoryService.getCategories({ limit: 1000 });
      const filteredCategoriesTree: Category[] = [];

      categoriesTree.rows.map(category => {
        if (category.parent === null) {
          filteredCategoriesTree.push(category);
        }
      });

      const categoryArray: any = [];
      filteredCategoriesTree.map(category => {
        categoryArray.push({
          '@id': category.id,
          '#': category.name,
        });
        category.children.map(childCategory => {
          categoryArray.push({ '@id': childCategory.id, '@parentId': category.id, '#': childCategory.name });
        });
      });

      const offer = filtered.map((product: Product) => {
        const images = this.productService.getProductVariantsImages(product.productVariants);
        const picture: any = [];
        images.map(image => {
          picture.push({ '#': `https://nbhoz.ru/api/images/${image}` });
        });
        const param: any = [];
        product.parameterProducts.map(paramObj => {
          const parameter: any = parameters.rows.find(parameter => parameter.id === paramObj.parameterId);
          if (paramObj.value == '-' || paramObj.value == '_' || paramObj.value == '') {
            console.log('empty param');
          } else {
            param.push({ '@name': `${parameter.name}`, '#': paramObj.value });
          }
        });

        return {
          '@id': product.id,
          'name': product.name,
          'url': `https://nbhoz.ru/product/${product.url}`,
          'price': product.productVariants[0].price,
          'currencyId': 'RUR',
          'categoryId': product.category.id,
          'vendor': 'NBHOZ',
          // 'picture': `https://nbhoz.ru/api/images/${product?.productVariants![0]?.images?.split(', ')[0]}`,
          picture,
          'description': `<![CDATA[<p>${
            product?.desc?.includes('|')
              ? product.desc.split('|')[1].split('Минимальная сумма заказа')[0]
              : product.desc.split('Минимальная сумма заказа')[0]
          }</p>]]>`,
          param,
          'store': 'true',
          'pickup': 'true',
          'delivery': 'false',
          'pickup-options': {
            option: {
              '@cost': '0',
              '@days': '0',
            },
          },
          // 'rating': product?.rating?.avg,
        };
      });
      const toIsoString = (date: any) => {
        let tzo = -date.getTimezoneOffset(),
          dif = tzo >= 0 ? '+' : '-',
          pad = function (num: number) {
            return (num < 10 ? '0' : '') + num;
          };

        return (
          date.getFullYear() +
          '-' +
          pad(date.getMonth() + 1) +
          '-' +
          pad(date.getDate()) +
          'T' +
          pad(date.getHours()) +
          ':' +
          pad(date.getMinutes()) +
          ':' +
          pad(date.getSeconds()) +
          dif +
          pad(Math.floor(Math.abs(tzo) / 60)) +
          ':' +
          pad(Math.abs(tzo) % 60)
        );
      };
      const currentDate = new Date();
      const dataWithTimeZone = toIsoString(currentDate);
      const payload = {
        yml_catalog: {
          '@date': dataWithTimeZone,
          'shop': {
            name: 'NBHOZ - интернет магазин хозтовары. по выгодным ценам',
            company: 'NBHOZ',
            url: 'https://nbhoz.ru',
            currencies: {
              currency: { '@id': 'RUR', '@rate': '1' },
            },
            categories: {
              category: categoryArray,
            },
            offers: {
              offer,
            },
          },
        },
      };
      const opts = {
        encoding: 'utf-8',
      };

      const root = create(opts, payload);

      const xml = root.end({ prettyPrint: true });
      resp.setHeader('Content-Type', 'text/xml');
      resp.send(xml);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get('yandex-webmaster-rss')
  async getProductsYandexWebMasterRSSFeed(req: Request, resp: Response) {
    try {
      const products: any = await this.productService.getProducts(req.query);

      const filtered = products.rows.filter((product: any) => product?.productVariants![0]?.price !== 1);

      let items = filtered.map((product: Product) => {
        const images = this.productService.getProductVariantsImages(product.productVariants);

        return `
       <div>
       <h3>Артикул : </h3>
       <span>${product.productVariants[0].artical}</span>
       </div>
       <a href="https://nbhoz.ru/product/${product.url}">
       <figure><img src="https://nbhoz.ru/api/images/${images[0]}"></figure>
       </a><div><a href="https://nbhoz.ru/product/${product.url}" >
       <h2>${product.name}</h2>
       </a>
       <p>${product?.desc?.includes('|') ? product.desc.split('|')[1] : product.desc}</p>
       <button formaction="https://nbhoz.ru/product/${
         product.url
       }" data-background-color="#000" data-color="white" data-primary="true">Заказать сейчас</button>
       `;
      });

      const payload = {
        rss: {
          '@xmlns:yandex': 'http://news.yandex.ru',
          '@xmlns:media': 'http://search.yahoo.com/mrss/',
          '@xmlns:turbo': 'http://turbo.yandex.ru',
          '@version': '2.0',
          'channel': {
            item: {
              '@turbo': 'true',
              'title': 'NBHOZ - Опт Товаров для Дома и Бизнеса',
              'link': `https://nbhoz.ru`,
              'turbo:content': {
                '#': `<![CDATA[${items.join(' ')}
                ]]>`,
              },
            },
          },
        },
      };

      const opts = {
        encoding: 'utf-8',
      };

      const root = create(opts, payload);

      const xml = root.end({ prettyPrint: true });
      resp.setHeader('Content-Type', 'text/xml');
      resp.send(xml);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get('vk/:fileName')
  async getProductsVK(req: Request, resp: Response) {
    const { fileName } = req.params;
    try {
      const products: any = await this.productService.getProducts({ limit: 100000 });
      const filtered = products.rows.filter((product: any) => product?.productVariants![0]?.price !== 1);
      const categoriesTree = await this.categoryService.getCategories({ limit: 1000 });
      const filteredCategoriesTree: Category[] = [];
      categoriesTree.rows.map(category => {
        if (category.parent === null) {
          filteredCategoriesTree.push(category);
        }
      });

      const categoryArray: any = [];
      filteredCategoriesTree.map(category => {
        categoryArray.push({
          '@id': category.id,
          '#': category.name,
        });
        category.children.map(childCategory => {
          categoryArray.push({ '@id': childCategory.id, '@parentId': category.id, '#': childCategory.name });
        });
      });

      const offer = filtered.map((product: any) => {
        return {
          '@id': product.id,
          '@available': 'true',
          'price': product.productVariants[0].price,
          'currencyId': 'RUB',
          'categoryId': product.category.id,
          'name': product.name.slice(0, 100),
          'description': product?.desc?.includes('|') ? product.desc.split('|')[1] : product.desc,
          'picture': `https://nbhoz.ru/api/images/${product?.productVariants![0]?.images?.split(', ')[0]}`,
          'url': `https://nbhoz.ru/product/${product.url}`,
          'rating': product?.rating?.avg,
        };
      });
      const currentDate = new Date();
      const payload = {
        yml_catalog: {
          '@date': `${currentDate.getFullYear()}-${
            currentDate.getMonth() < 10 ? '0' + currentDate.getMonth() : currentDate.getMonth()
          }-${
            currentDate.getDate() < 10 ? '0' + currentDate.getDate() : currentDate.getDate()
          } ${currentDate.getHours()}:${currentDate.getMinutes()}`,
          'shop': {
            name: 'NBHOZ - интернет магазин хозтовары оптом. по выгодным ценам',
            company: 'NBHOZ',
            url: 'https://nbhoz.ru',
            currencies: {
              currency: {
                '@id': 'RUB',
                '@rate': '1',
              },
            },
            categories: {
              category: categoryArray,
            },
            offers: {
              offer,
            },
          },
        },
      };
      const opts = {
        encoding: 'utf-8',
      };

      const root = create(opts, payload);

      const xml = root.end({ prettyPrint: true });

      await fs.writeFile(`${__dirname}/vk.xml`, xml, { flag: 'w' }, err => {
        if (err) console.log(err);
      });

      const loc = `${__dirname}/${fileName}`;
      resp.writeHead(200, {
        'Content-Type': 'text/xml',
      });
      let filestream = fs.createReadStream(loc);
      filestream.pipe(resp);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('priceRange')
  async getProductsPriceRange(req: Request, resp: Response) {
    try {
      const products = await this.productService.getProductsPriceRange(req.query);

      resp.json(products);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('by-url/:url')
  async getProductByUrl(req: Request, resp: Response) {
    const { url } = req.params;
    try {
      const product = await this.productService.getProductByUrl(url);

      resp.json(product);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('productsUnderOneThousand')
  async getProductsUnderOneThousand(req: Request, resp: Response) {
    try {
      const products = await this.productService.getProducts({ tags: ['UnderOneThousand'] });

      resp.json(products);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get(':id')
  async getProduct(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const product = await this.productService.getProduct(id);

      resp.json(product);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
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
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
