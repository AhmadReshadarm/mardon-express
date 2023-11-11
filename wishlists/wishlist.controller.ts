import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { Controller, Delete, Get, Middleware, Post, Put } from '../core/decorators';
import { HttpStatus } from '../core/lib/http-status';
import { isAdmin, verifyToken } from '../core/middlewares';
import { WishlistService } from './wishlist.service';

@singleton()
@Controller('/wishlists')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  @Middleware([verifyToken, isAdmin])
  async getWishlists(req: Request, resp: Response) {
    try {
      const wishlists = await this.wishlistService.getWishlists(req.query);

      resp.json(wishlists);
    } catch (error) {}
  }

  @Get(':id')
  async getWishlist(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const wishlist = await this.wishlistService.getWishlist(id);

      resp.json(wishlist);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('wishlistProducts/:id')
  async getWishlistProducts(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const products = await this.wishlistService.getWishlistProducts(id);

      resp.json(products);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post()
  async createWishlist(req: Request, resp: Response) {
    try {
      const created = await this.wishlistService.createWishlist();

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Put(':id')
  async updateWishlist(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const updated = await this.wishlistService.updateWishlist(id, req.body);

      resp.status(HttpStatus.CREATED).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeWishlist(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const removed = await this.wishlistService.removeWishlist(id);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
