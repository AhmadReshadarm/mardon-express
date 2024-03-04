import { injectable } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { ParameterProducts, Product, ProductVariant, Review, User } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { ProductDTO, ProductQueryDTO } from '../catalog.dtos';
import { PaginationDTO, RatingDTO } from '../../core/lib/dto';
import axios from 'axios';
import { validation } from '../../core/lib/validator';

@injectable()
export class ProductService {
  private productRepository: Repository<Product>;
  private parameterProductsRepository: Repository<ParameterProducts>;
  private productVariantRepository: Repository<ProductVariant>;

  constructor(dataSource: DataSource) {
    this.productRepository = dataSource.getRepository(Product);
    this.parameterProductsRepository = dataSource.getRepository(ParameterProducts);
    this.productVariantRepository = dataSource.getRepository(ProductVariant);
  }

  async getProducts(queryParams: ProductQueryDTO): Promise<PaginationDTO<ProductDTO>> {
    const {
      name,
      artical,
      minPrice,
      maxPrice,
      desc,
      available,
      colors,
      color,
      categories,
      parent,
      category,
      // brands,
      // brand,
      tags,
      tag,
      sortBy = 'name',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
      image,
    } = queryParams;
    const queryBuilder = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'categoryParent')
      // .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.tags', 'tag')
      .leftJoinAndSelect('product.parameterProducts', 'parameterProducts')
      .leftJoinAndSelect('product.productVariants', 'productVariant')
      .leftJoinAndSelect('productVariant.color', 'color');

    if (name) {
      queryBuilder
        .andWhere('product.name LIKE :name', { name: `%${name}%` })
        .orWhere('productVariant.artical LIKE :artical', { artical: `%${name}%` });
    }

    if (minPrice) {
      queryBuilder.andWhere('productVariant.price >= :minPrice', { minPrice: minPrice });
    }
    if (maxPrice) {
      queryBuilder.andWhere('productVariant.price <= :maxPrice', { maxPrice: maxPrice });
    }
    if (image) {
      queryBuilder.andWhere('productVariant.images LIKE :image', { image: `%${image}%` });
    }
    if (desc) {
      queryBuilder.andWhere('product.desc LIKE :desc', { desc: `%${desc}%` });
    }
    if (available) {
      queryBuilder.andWhere('productVariant.available EQUAL :available', { available: `%${available}%` });
    }
    if (colors) {
      queryBuilder.andWhere('color.url IN (:...colors)', { colors: colors });
    }
    if (color) {
      queryBuilder.andWhere('color.url = :color', { color: color });
    }
    if (parent) {
      queryBuilder.andWhere('categoryParent.url = :parent', { parent: parent });
    }
    if (categories) {
      queryBuilder.andWhere('category.url IN (:...categories)', { categories: categories });
    }
    if (category) {
      queryBuilder.andWhere('category.url = :category', { category: category });
    }
    // if (brands) {
    //   queryBuilder.andWhere('brand.url IN (:...brands)', { brands: brands });
    // }
    // if (brand) {
    //   queryBuilder.andWhere('brand.url = :brand', { brand: brand });
    // }
    if (tags) {
      queryBuilder.andWhere('tag.url IN (:...tags)', { tags: tags });
    }
    if (tag) {
      queryBuilder.andWhere('tag.url = :tag', { tag: tag });
    }

    queryBuilder.orderBy(`product.${sortBy}`, orderBy).skip(offset).take(limit);

    const products = await queryBuilder.getMany();

    const results = products.map(async product => await this.mergeProduct(product));

    return {
      rows: await Promise.all(results),
      length: await queryBuilder.getCount(),
    };
  }

  async getProductsPriceRange(
    queryParams: ProductQueryDTO,
  ): Promise<{ minPrice: number; maxPrice: number } | undefined> {
    const { name, parent, categories } = queryParams;
    const queryBuilder = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productVariants', 'productVariant')
      .leftJoinAndSelect('category.parent', 'categoryParent');

    if (name) {
      queryBuilder.andWhere('product.name LIKE :name', { name: `%${name}%` });
    }
    if (parent) {
      queryBuilder.andWhere('categoryParent.url = :parent', { parent: parent });
    }
    if (categories) {
      queryBuilder.andWhere('category.url IN (:...categories)', { categories: categories });
    }
    //  TODO add price rang based on tags, colors
    return queryBuilder
      .select('MIN(productVariant.price)', 'minPrice')
      .addSelect('MAX(productVariant.price)', 'maxPrice')
      .getRawOne();
  }

  async getProduct(id: string): Promise<ProductDTO> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      // .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.tags', 'tag')
      .leftJoinAndSelect('category.parameters', 'parameter')
      .leftJoinAndSelect('product.parameterProducts', 'parameterProducts')
      .leftJoinAndSelect('product.productVariants', 'productVariant')
      .leftJoinAndSelect('productVariant.color', 'color')
      .where('product.id = :id', { id: id })
      .getOne();

    if (!product) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return this.mergeProduct(product);
  }

  // async createParameters(parameters: ParameterProducts[], id: string) {
  //   parameters.map(async parameter => {
  //     parameter.productId = id;
  //     return await this.parameterProductsRepository.save(parameter);
  //   });
  // }
  createParameters = async (parameters: ParameterProducts[], id: string, counter: number) => {
    if (parameters.length > counter) {
      parameters[counter].productId = id;
      await this.parameterProductsRepository.save(parameters[counter]);
      counter = counter + 1;
      this.createParameters(parameters, id, counter);
    }
  };

  async createProductVariant(variant: ProductVariant, product: Product) {
    variant.product = product;
    return await this.productVariantRepository.save(variant);
  }

  async getProductByUrl(url: string): Promise<ProductDTO> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'categoryParent')
      // .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.tags', 'tag')
      .leftJoinAndSelect('product.parameterProducts', 'parameterProducts')
      .leftJoinAndSelect('parameterProducts.parameter', 'parameter')
      .leftJoinAndSelect('product.productVariants', 'productVariant')
      .leftJoinAndSelect('productVariant.color', 'color')
      .where('product.url = :url', { url: url })
      .getOne();

    if (!product) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return await this.mergeProduct(product);
  }

  async createProduct(newProduct: Product): Promise<Product> {
    const created = await this.productRepository.save(new Product(newProduct));
    let counter = 0;
    if (newProduct.productVariants) {
      // });
      counter = 0;

      const addAllVariants = async (variants: ProductVariant[], product: Product) => {
        if (variants.length > counter) {
          await this.createProductVariant(variants[counter], product);
          counter = counter + 1;
          addAllVariants(variants, product);
        }
      };
      addAllVariants(newProduct.productVariants, created);
    }

    if (newProduct.parameterProducts) {
      counter = 0;
      await this.createParameters(newProduct.parameterProducts, created.id, counter);
    }

    return created;
  }

  async updateProduct(id: string, productDTO: Product) {
    const product = await this.productRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['productVariants'],
    });

    const { parameterProducts, productVariants, ...others } = productDTO;

    await this.productRepository.save({
      ...product,
      ...others,
    });

    if (parameterProducts) {
      await validation(parameterProducts);

      if (product.parameterProducts) {
        await Promise.all(
          product.parameterProducts.map(async parameterProduct => {
            await this.parameterProductsRepository.remove(parameterProduct);
          }),
        );
      }
      let counter = 0;
      await this.createParameters(parameterProducts, product.id, counter);
    }

    let variants: ProductVariant[] = [];

    if (productVariants) {
      await validation(productVariants);

      product.productVariants?.forEach(variant => {
        const curVariant = productDTO.productVariants?.find(({ id }) => variant.id == id?.toString());

        if (!curVariant) {
          this.productVariantRepository.remove(variant);
          product.productVariants = product.productVariants?.filter(curVariant => curVariant.id !== variant.id);
        }
      });

      variants = product.productVariants;

      for (const variantDTO of productDTO.productVariants) {
        const variant = await this.productVariantRepository.findOne({
          where: {
            id: Equal(variantDTO.id),
          },
        });

        if (!variant) {
          const variantData = new ProductVariant({ ...(variantDTO as any) });
          const newVariant = await this.createProductVariant(variantData, product);
          variants.push(newVariant);
        }

        if (variant) {
          await this.productVariantRepository.update(variant.id, { ...variant, ...variantDTO });
        }
      }
    }

    return {
      ...productDTO,
      id: product.id,
      productVariants: variants.map(variant => {
        const { product, ...others } = variant;
        return {
          ...others,
        };
      }),
    };
  }

  async removeProduct(id: string) {
    const product = await this.productRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.productRepository.remove(product);
  }

  async getReviewsByProductId(id: string): Promise<PaginationDTO<Review> | null> {
    const reviews = await axios.get(`${process.env.REVIEWS_DB}/reviews/`, {
      params: {
        productId: id,
        merge: 'false',
        limit: 100000,
      },
    });

    return reviews.data.length > 0 ? reviews.data : null;
  }

  async getQuestionsByProductId(id: string): Promise<PaginationDTO<Review> | null> {
    const reviews = await axios.get(`${process.env.QUESTIONS_DB}/questions/`, {
      params: {
        productId: id,
        merge: 'false',
        limit: 100000,
      },
    });

    return reviews.data.length > 0 ? reviews.data : null;
  }

  async getProductRatingFromReviews(reviews: PaginationDTO<Review>): Promise<RatingDTO | null> {
    let counter: number = 0;
    let totalRating: number = 0;

    const rating: RatingDTO = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      'avg': 0,
    };

    reviews.rows.map((review: Review) => {
      const index = String(review.rating);
      rating[index as keyof typeof rating] += 1;

      totalRating += review.rating;
      counter += 1;
    });

    rating.avg = +(totalRating / counter).toFixed(2);
    return rating;
  }

  async mergeProduct(product: Product): Promise<any> {
    const rawReviews = (await this.getReviewsByProductId(product.id)) as any;
    const rawQuestions = (await this.getQuestionsByProductId(product.id)) as any;
    const rating = rawReviews ? await this.getProductRatingFromReviews(rawReviews) : null;
    const reviews = [];

    const users = {} as any;
    if (Array.isArray(rawReviews?.rows)) {
      for (const review of rawReviews?.rows) {
        if (!users[review.userId]) {
          users[review.userId] = await this.getUserById(review.userId);
        }

        const comments = [];

        for (const comment of review.comments) {
          if (!users[comment.userId]) {
            users[comment.userId] = await this.getUserById(comment.userId);
          }

          comments.push({
            ...comment,
            user: users[comment.userId],
          });
        }

        reviews.push({
          ...review,
          user: users[review.userId],
          comments: comments,
        });
      }
    }

    const questions = [];

    if (Array.isArray(rawQuestions?.rows)) {
      for (const question of rawQuestions?.rows) {
        if (!users[question.userId]) {
          users[question.userId] = await this.getUserById(question.userId);
        }

        const comments = [];

        for (const comment of question.comments) {
          if (!users[comment.userId]) {
            users[comment.userId] = await this.getUserById(comment.userId);
          }

          comments.push({
            ...comment,
            user: users[comment.userId],
          });
        }

        questions.push({
          ...question,
          user: users[question.userId],
          comments: comments,
        });
      }
    }

    return {
      ...product,
      rating: rating,
      reviews: reviews,
      questions: questions,
    };
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const res = await axios.get(`${process.env.USERS_DB}/users/inner/${id}`, {
        data: { secretKey: process.env.INNER_AUTH_CALL_SECRET_KEY },
      });

      return res.data;
    } catch (e: any) {
      if (e.name === 'AxiosError' && e.response.status === 403) {
        throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
      }
    }
  }
}
