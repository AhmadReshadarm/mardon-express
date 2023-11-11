import axios from 'axios';
import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { Product, Wishlist, WishlistProduct } from '../core/entities';
import { WishlistProductService } from './wishlist-product.service';
import { ProductDTO, WishlistQueryDTO } from './wishlist.dtos';
import { PaginationDTO } from '../core/lib/dto';

@singleton()
export class WishlistService {
  private wishlistRepository: Repository<Wishlist>;
  private wishlistProductRepository: Repository<WishlistProduct>;

  constructor(
    dataSource: DataSource,
    private wishlistProductService: WishlistProductService,
  ) {
    this.wishlistRepository = dataSource.getRepository(Wishlist);
    this.wishlistProductRepository = dataSource.getRepository(WishlistProduct);
  }

  async getWishlists(queryParams: WishlistQueryDTO): Promise<PaginationDTO<Wishlist>> {
    const { sortBy = 'productId', orderBy = 'DESC', limit = 10, offset = 0 } = queryParams;

    const queryBuilder = this.wishlistRepository.createQueryBuilder('wishlist');

    queryBuilder.orderBy(`wishlist.${sortBy}`, orderBy).skip(offset).take(limit);

    return {
      rows: await queryBuilder.getMany(),
      length: await queryBuilder.getCount(),
    };
  }

  async getWishlist(id: string): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['items'],
    });

    return wishlist;
  }

  async getProductById(id: string): Promise<ProductDTO | undefined> {
    try {
      const res = await axios.get(`${process.env.CATALOG_DB}/products/${id}`);

      return res.data;
    } catch (e: any) {
      if (e.name !== 'AxiosError' && e.response.status !== 404) {
        throw new Error(e);
      }
    }
  }

  async createWishlist(): Promise<Wishlist> {
    const wishlist = new Wishlist({ items: [] });

    return this.wishlistRepository.save(wishlist);
  }

  async updateWishlist(id: string, whishlistDTO: Wishlist) {
    const wishlist = await this.wishlistRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['items'],
    });

    wishlist.items.forEach(item => {
      const curWishlistProduct = whishlistDTO.items.find(({ productId }) => item.productId === productId.toString());

      if (!curWishlistProduct) {
        this.wishlistProductRepository.remove(item);
        wishlist.items = wishlist.items.filter(curItem => curItem.id !== item.id);
      }
    });

    const items = [...wishlist.items];

    for (const { productId } of whishlistDTO.items) {
      const wishlistProduct = await this.wishlistProductRepository.findOneBy({
        productId: Equal(productId),
        wishlist: {
          id: Equal(wishlist.id),
        },
      });

      if (!wishlistProduct) {
        const wishlistProductData = new WishlistProduct({ productId, wishlist });
        const newWishlistProduct = await this.wishlistProductService.createWishlistProduct(wishlistProductData);
        items.push(newWishlistProduct);
      }
    }

    const products = [];

    for (const item of items) {
      const product = await this.getProductById(item.productId);

      if (product) {
        products.push(product);
      }
    }

    return {
      ...wishlist,
      items,
      products,
    };
  }

  async removeWishlist(id: string) {
    const wishlist = await this.wishlistRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.wishlistRepository.remove(wishlist);
  }

  async getWishlistProducts(id: string) {
    const wishlist = await this.getWishlist(id);
    const products = [];

    for (const item of wishlist.items) {
      const product = await this.getProductById(item.productId);

      if (product) {
        products.push(product);
      }
    }

    return {
      ...wishlist,
      products,
    };
  }
}
