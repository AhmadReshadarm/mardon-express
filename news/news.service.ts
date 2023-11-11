import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { News } from '../core/entities';
import { validation } from '../core/lib/validator';
import { CreateNewsPostDTO, newsDTO, NewsQueryDTO } from './news.dtos';
import { PaginationDTO } from '../core/lib/dto';
import { CustomExternalError } from '../core/domain/error/custom.external.error';
import { ErrorCode } from '../core/domain/error/error.code';
import { HttpStatus } from '../core/lib/http-status';
@singleton()
export class NewsService {
  private newsRepository: Repository<News>;

  constructor(dataSource: DataSource) {
    this.newsRepository = dataSource.getRepository(News);
  }

  async getAllNews(queryParams: NewsQueryDTO): Promise<PaginationDTO<newsDTO | News[]>> {
    const { title, showOnMain, sortBy = 'createdAt', orderBy = 'DESC', offset = 0, limit = 4 } = queryParams;

    const queryBuilder = this.newsRepository.createQueryBuilder('news');
    if (title) {
      queryBuilder.andWhere('news.title LIKE :title', { title: `%${title}%` });
    }
    if (showOnMain) {
      queryBuilder.andWhere('news.showOnMain = :showOnMain', { showOnMain: JSON.parse(showOnMain as any) });
    }
    queryBuilder.orderBy(`news.${sortBy}`, orderBy).skip(offset).take(limit);
    return {
      rows: await queryBuilder.getMany(),
      length: await queryBuilder.getCount(),
    };
  }

  async getNews(id: string): Promise<News> {
    const news = await this.newsRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });
    return news;
  }

  async getNewsByUrl(url: string): Promise<News> {
    const news = await this.newsRepository.createQueryBuilder('news').where('news.url = :url', { url: url }).getOne();
    if (!news) {
      throw new CustomExternalError([ErrorCode.ENTITY_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    return news;
  }

  async createNews(newsDTO: CreateNewsPostDTO): Promise<News> {
    // const newNews = await validation(new News(newsDTO));

    return this.newsRepository.save(newsDTO);
  }

  async updateNews(id: string, newsDTO: News) {
    const news = await this.newsRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.newsRepository.save({
      ...news,
      ...newsDTO,
    });
  }

  async removeNews(id: string) {
    const news = await this.newsRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.newsRepository.remove(news);
  }
}
