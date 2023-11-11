import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { Size } from '../../core/entities';
import { validation } from '../../core/lib/validator';
import { SizeQueryDTO } from '../catalog.dtos';
import { PaginationDTO } from '../../core/lib/dto';

@singleton()
export class SizeService {
  private sizeRepository: Repository<Size>;

  constructor(dataSource: DataSource) {
    this.sizeRepository = dataSource.getRepository(Size);
  }

  async getSizes(queryParams: SizeQueryDTO): Promise<PaginationDTO<Size>> {
    const { name, products, url, parent, sortBy = 'name', orderBy = 'DESC', offset = 0, limit = 10 } = queryParams;

    const queryBuilder = await this.sizeRepository
      .createQueryBuilder('size')
      .leftJoinAndSelect('size.products', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'categoryParent');

    if (name) {
      queryBuilder.andWhere('size.name LIKE :name', { name: `%${name}%` });
    }
    if (url) {
      queryBuilder.andWhere('size.url LIKE :url', { url: `%${url}%` });
    }
    if (products) {
      queryBuilder.andWhere('product.url IN (:...products)', { products: JSON.parse(products) });
    }
    if (parent) {
      queryBuilder.andWhere('categoryParent.url = :parent', { parent: `${parent}` });
    }
    queryBuilder.orderBy(`size.${sortBy}`, orderBy).skip(offset).take(limit);

    return {
      rows: await queryBuilder.getMany(),
      length: await queryBuilder.getCount(),
    };
  }

  async getSize(id: string): Promise<Size> {
    const size = await this.sizeRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return size;
  }

  async getSizesByIds(ids: string[]): Promise<Size[]> {
    const sizesPromises = ids.map(async sizeId => {
      return this.getSize(sizeId);
    });

    return Promise.all(sizesPromises);
  }

  async createSize(sizeDTO: Size): Promise<Size> {
    const newSize = await validation(new Size(sizeDTO));

    return this.sizeRepository.save(newSize);
  }

  async updateSize(id: string, sizeDTO: Size) {
    const size = await this.sizeRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.sizeRepository.save({
      ...size,
      ...sizeDTO,
    });
  }

  async removeSize(id: string) {
    const size = await this.sizeRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.sizeRepository.remove(size);
  }
}
