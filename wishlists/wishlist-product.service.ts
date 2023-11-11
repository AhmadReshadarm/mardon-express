import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import axios from 'axios';
import { v4 } from 'uuid';
import { WishlistProduct } from '../core/entities';
import { WishlistDTO } from './wishlist.dtos';

@singleton()
export class WishlistProductService {
  private wishlistProductRepository: Repository<WishlistProduct>;

  constructor(dataSource: DataSource) {
    this.wishlistProductRepository = dataSource.getRepository(WishlistProduct);
  }

  async getProductById(id: string): Promise<WishlistDTO | undefined> {
    try {
      const res = await axios.get(`${process.env.CATALOG_DB}/products/${id}`);

      return res.data;
    } catch (e: any) {
      if (e.name !== 'AxiosError') {
        throw new Error(e)
      }
    }
  }

  async createWishlistProduct(newWishlistProduct: WishlistProduct): Promise<WishlistProduct> {
    // newWishlistProduct.id = v4();

    const wishlistProduct = await this.wishlistProductRepository.save(newWishlistProduct);

    return wishlistProduct;
  }

  async removeWishlistProduct(id: string) {
    const wishlistProduct = await this.wishlistProductRepository.findOneOrFail({
      where: {
        id: Equal(id),
      }
    });

    return this.wishlistProductRepository.remove(wishlistProduct);
  }

  async mergeWishlistProduct(wishlistProduct: WishlistProduct): Promise<any> {
    return {
      id: wishlistProduct.id,
      product: await this.getProductById(wishlistProduct.productId),
    }
  }
}
