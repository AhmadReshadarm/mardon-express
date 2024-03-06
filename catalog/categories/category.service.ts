import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository, TreeRepository } from 'typeorm';
import { Category, Parameter } from '../../core/entities';
import { CategoryQueryDTO, CreateCategoryDTO, CreateParameterDTO, ICreateCategoryAnswer } from '../catalog.dtos';
import { PaginationDTO } from '../../core/lib/dto';
import { validation } from '../../core/lib/validator';
import { ParameterService } from '../../catalog/parameters/parameter.service';

@singleton()
export class CategoryService {
  private categoryRepository: Repository<Category>;
  private categoryTreeRepository: TreeRepository<Category>;
  private parametersRepository: Repository<Parameter>;

  constructor(dataSource: DataSource, private parameterService: ParameterService) {
    this.categoryRepository = dataSource.getRepository(Category);
    this.categoryTreeRepository = dataSource.getTreeRepository(Category);
    this.parametersRepository = dataSource.getRepository(Parameter);
  }

  async getCategories(queryParams: CategoryQueryDTO): Promise<PaginationDTO<Category>> {
    const {
      name,
      image,
      url,
      parameters,
      parent,
      children,
      sortBy = 'name',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parameters', 'parameter')
      .leftJoinAndSelect('category.children', 'categoryChildren')
      .leftJoinAndSelect('category.parent', 'categoryParent');

    if (name) {
      queryBuilder.andWhere('category.name LIKE :name', { name: `%${name}%` });
    }
    if (image) {
      queryBuilder.andWhere('category.image LIKE :image', { image: `%${image}%` });
    }
    if (url) {
      queryBuilder.andWhere('category.url LIKE :url', { url: `%${url}%` });
    }
    if (parameters) {
      queryBuilder.andWhere('parameter.name IN (:...parameters)', { parameters: parameters });
    }
    if (parent) {
      queryBuilder.andWhere('categoryParent.url = :parent', { parent: parent });
    }
    if (children) {
      queryBuilder.andWhere('categoryChildren.id IN (:...children)', { children: children });
    }

    queryBuilder.orderBy(`category.${sortBy}`, orderBy).skip(offset).take(limit);

    return {
      rows: await queryBuilder.getMany(),
      length: await queryBuilder.getCount(),
    };
  }

  async getCategory(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['parent', 'children', 'parameters'],
    });

    return category;
  }

  async getCategoriesTree(): Promise<Category[]> {
    return await this.categoryTreeRepository.findTrees();
  }

  async createParameters(parameters: CreateParameterDTO[], category: Category): Promise<string[]> {
    const ids = parameters.map(async parameter => {
      parameter.category = category;
      const created = await this.parametersRepository.save(parameter);
      return created.id;
    });

    return Promise.all(ids);
  }

  async createCategory(categoryDTO: CreateCategoryDTO): Promise<ICreateCategoryAnswer> {
    const { parameters } = categoryDTO;

    if (parameters) {
      await validation(parameters);
    }

    const created = await this.categoryRepository.save(categoryDTO);
    const parametersIds = parameters ? await this.createParameters(parameters, created) : null;

    return {
      categoryId: created.id,
      parametersIds: parametersIds,
    };
  }

  async updateCategory(id: string, categoryDTO: Category) {
    const category = await this.categoryRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['parameters'],
    });

    category.parameters.forEach(parameter => {
      const curParameter = categoryDTO.parameters.find(({ id }) => id == parameter.id);

      if (!curParameter) {
        this.parametersRepository.remove(parameter);
        category.parameters = category.parameters.filter(curParameter => curParameter.id !== parameter.id);
      }
    });

    const parameters = category.parameters;

    for (const { id, name } of categoryDTO.parameters) {
      const parameter = await this.parametersRepository.findOne({
        where: {
          id: Equal(id),
        },
      });

      if (!parameter) {
        const parameterData = new Parameter({ name, category });
        const createdParameter = await this.parameterService.createParameter(parameterData);
        parameters.push(createdParameter);
      }

      if (parameter) {
        const updatedParameter = await this.parameterService.updateParameter(parameter.id, {
          ...parameter,
          category,
          name,
        });
        const curParameter = parameters.find(parameter => parameter.id == updatedParameter.id)!;
        curParameter.name = name;
      }
    }

    const updated = await this.categoryRepository.save({
      ...category,
      ...categoryDTO,
      // name: categoryDTO.name,
      // desc: categoryDTO.desc,
      // parent: categoryDTO.parent,
      // url: categoryDTO.url,
      // image: categoryDTO.image,
    });

    return {
      // ...category,
      ...updated,
      parameters: parameters.map(({ id, name }) => ({ id, name })),
    };
  }

  async removeCategory(id: string) {
    const category = await this.categoryRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.categoryRepository.remove(category);
  }
}
