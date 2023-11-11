import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { Artical } from '../../core/entities';
import { validation } from '../../core/lib/validator';
import { ArticalQueryDTO } from '../catalog.dtos';
import { PaginationDTO } from '../../core/lib/dto';

@singleton()
export class ArticalService {
  private articalRepository: Repository<Artical>;

  constructor(dataSource: DataSource) {
    this.articalRepository = dataSource.getRepository(Artical);
  }

  async getArticals(queryParams: ArticalQueryDTO): Promise<PaginationDTO<Artical>> {
    const {
      name,
      category,
      parent,
      products,
      url,
      sortBy = 'name',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = await this.articalRepository
      .createQueryBuilder('artical')
      .leftJoinAndSelect('artical.productVariants', 'productVariant')
      .leftJoinAndSelect('productVariant.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'categoryParent');

    if (category) {
      queryBuilder.andWhere('category.url = :category', { category: `${category}` });
    }
    if (parent) {
      queryBuilder.andWhere('categoryParent.url = :parent', { parent: `${parent}` });
    }
    if (name) {
      queryBuilder.andWhere('artical.name LIKE :name', { name: `%${name}%` });
    }
    if (url) {
      queryBuilder.andWhere('artical.url LIKE :url', { url: `%${url}%` });
    }
    if (products) {
      queryBuilder.andWhere('product.url IN (:...products)', { products: products });
    }

    queryBuilder.orderBy(`artical.${sortBy}`, orderBy).skip(offset).take(limit);

    return {
      rows: await queryBuilder.getMany(),
      length: await queryBuilder.getCount(),
    };
  }

  async getArtical(id: string): Promise<Artical> {
    const artical = await this.articalRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return artical;
  }

  async getArticalsByIds(ids: string[]): Promise<Artical[]> {
    const articalsPromises = ids.map(async articalId => {
      return this.getArtical(articalId);
    });

    return Promise.all(articalsPromises);
  }

  async createArtical(articalDTO: Artical): Promise<Artical> {
    const newArtical = await validation(new Artical(articalDTO));

    return this.articalRepository.save(newArtical);
  }

  async updateArtical(id: string, articalDTO: Artical) {
    const artical = await this.articalRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.articalRepository.save({
      ...artical,
      ...articalDTO,
    });
  }

  async removeArtical(id: string) {
    const artical = await this.articalRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.articalRepository.remove(artical);
  }
}
