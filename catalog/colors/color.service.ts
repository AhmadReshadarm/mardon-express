import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { Color } from '../../core/entities';
import { validation } from '../../core/lib/validator';
import { ColorQueryDTO } from '../catalog.dtos';
import { PaginationDTO } from '../../core/lib/dto';

@singleton()
export class ColorService {
  private colorRepository: Repository<Color>;

  constructor(dataSource: DataSource) {
    this.colorRepository = dataSource.getRepository(Color);
  }

  async getColors(queryParams: ColorQueryDTO): Promise<PaginationDTO<Color>> {
    const {
      name,
      category,
      parent,
      products,
      url,
      code,
      sortBy = 'name',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = await this.colorRepository
      .createQueryBuilder('color')
      .leftJoinAndSelect('color.productVariants', 'productVariant')
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
      queryBuilder.andWhere('color.name LIKE :name', { name: `%${name}%` });
    }
    if (url) {
      queryBuilder.andWhere('color.url LIKE :url', { url: `%${url}%` });
    }
    if (code) {
      queryBuilder.andWhere('color.code = :code', { code: `%${code}%` });
    }
    if (products) {
      queryBuilder.andWhere('product.url IN (:...products)', { products: products });
    }

    queryBuilder.orderBy(`color.${sortBy}`, orderBy).skip(offset).take(limit);

    return {
      rows: await queryBuilder.getMany(),
      length: await queryBuilder.getCount(),
    };
  }

  async getColor(id: string): Promise<Color> {
    const color = await this.colorRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return color;
  }

  async getColorsByIds(ids: string[]): Promise<Color[]> {
    const colorsPromises = ids.map(async colorId => {
      return this.getColor(colorId);
    });

    return Promise.all(colorsPromises);
  }

  async createColor(colorDTO: Color): Promise<Color> {
    const newColor = await validation(new Color(colorDTO));

    return this.colorRepository.save(newColor);
  }

  async updateColor(id: string, colorDTO: Color) {
    const color = await this.colorRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.colorRepository.save({
      ...color,
      ...colorDTO,
    });
  }

  async removeColor(id: string) {
    const color = await this.colorRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.colorRepository.remove(color);
  }
}
