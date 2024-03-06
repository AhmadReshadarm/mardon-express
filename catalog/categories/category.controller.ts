import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { CategoryService } from './category.service';
import { Category } from '../../core/entities';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, verifyToken } from '../../core/middlewares';
import { CreateCategoryDTO } from '../catalog.dtos';
import { ProductService } from '../products/product.service';

@singleton()
@Controller('/categories')
export class CategoryController {
  constructor(private categoryService: CategoryService, private productService: ProductService) {}

  @Get()
  async getCategories(req: Request, resp: Response) {
    try {
      const categories = await this.categoryService.getCategories(req.query);

      resp.json(categories);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Get('categoriesTree')
  async getCategoriesTree(req: Request, resp: Response) {
    try {
      // const categories = await this.categoryService.getCategoriesTree();
      const categoriesTree = await this.categoryService.getCategories({ limit: 1000 });
      const filteredCategoriesTree: Category[] = [];
      categoriesTree.rows.map(category => {
        if (category.parent === null) {
          filteredCategoriesTree.push(category);
        }
      });

      // resp.json(categories);
      resp.status(HttpStatus.OK).json(filteredCategoriesTree);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Get(':id')
  async getCategory(req: Request, resp: Response) {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getCategory(id);

      resp.json(category);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Post()
  @Middleware([verifyToken, isAdmin])
  async createCategory(req: Request, resp: Response) {
    try {
      const { parentId } = req.body;
      const newCategory: CreateCategoryDTO = await validation(req.body);

      if (parentId) {
        newCategory.parent = await this.categoryService.getCategory(parentId);
      }

      const created = await this.categoryService.createCategory(newCategory);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateCategory(req: Request, resp: Response) {
    try {
      const { id } = req.params;
      const { parentId } = req.body;
      const newCategory = await validation(new Category(req.body));

      if (parentId) {
        newCategory.parent = await this.categoryService.getCategory(parentId);
      } else {
        newCategory.parent = undefined;
      }

      const updated = await this.categoryService.updateCategory(id, newCategory);

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeCategory(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const category = await this.categoryService.getCategory(id);

      const hasData = await this.productService.getProducts({ category: category.url });

      if (category.children.length !== 0) {
        resp.status(HttpStatus.FORBIDDEN).json(category);
        return;
      }
      if (hasData.length !== 0) {
        resp.status(HttpStatus.FORBIDDEN).json(hasData);
        return;
      }

      const removed = await this.categoryService.removeCategory(id);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }
}
