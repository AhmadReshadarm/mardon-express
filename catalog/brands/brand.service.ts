import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { Brand } from '../../core/entities';
import { PaginationDTO } from '../../core/lib/dto';
import { validation } from '../../core/lib/validator';
import { BrandQueryDTO } from '../catalog.dtos';

@singleton()
export class BrandService {
  private brandRepository: Repository<Brand>;

  constructor(dataSource: DataSource) {
    this.brandRepository = dataSource.getRepository(Brand);
  }

  async getBrands(queryParams: BrandQueryDTO): Promise<PaginationDTO<Brand>> {
    const {
      name,
      image,
      showOnMain,
      category,
      parent,
      sortBy = 'name',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = await this.brandRepository
      .createQueryBuilder('brand')
      .leftJoinAndSelect('brand.products', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'categoryParent');

    if (name) {
      queryBuilder.andWhere('brand.name LIKE :name', { name: `%${name}%` });
    }
    if (image) {
      queryBuilder.andWhere('brand.image LIKE :image', { image: `%${image}%` });
    }
    if (category) {
      queryBuilder.andWhere('category.url = :category', { category: `${category}` });
    }
    if (parent) {
      queryBuilder.andWhere('categoryParent.url = :parent', { parent: `${parent}` });
    }
    if (showOnMain) {
      queryBuilder.andWhere('brand.showOnMain = :showOnMain', { showOnMain: JSON.parse(showOnMain as any) ? 1 : 0 });
    }

    queryBuilder.orderBy(`brand.${sortBy}`, orderBy).skip(offset).take(limit);

    return {
      rows: (await queryBuilder.getMany()).map(brand => ({
        id: brand.id,
        image: brand.image,
        name: brand.name,
        url: brand.url,
        showOnMain: brand.showOnMain,
      })),
      length: await queryBuilder.getCount(),
    };
  }

  async getBrand(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return brand;
  }

  async createBrand(brandDTO: Brand): Promise<Brand> {
    const newBrand = await validation(new Brand(brandDTO));

    return this.brandRepository.save(newBrand);
  }

  async updateBrand(id: string, brandDTO: Brand) {
    const brand = await this.brandRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.brandRepository.save({
      ...brand,
      ...brandDTO,
    });
  }

  async removeBrand(id: string) {
    const brand = await this.brandRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.brandRepository.remove(brand);
  }
}
