import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../core/lib/http-status';
import { NewsService } from './news.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../core/decorators';
import { isAdmin, verifyToken } from '../core/middlewares';

@singleton()
@Controller('/news')
export class NewsController {
  constructor(private newsService: NewsService) {
    (async () => {
      const news = await this.newsService.getAllNews({ limit: 1000 });

      if (!news.length) {
        await this.newsService.createNews({
          title: 'news title',
          url: 'news_url',
          post: '{"blocks":[{"key":"44ern","text":"news","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
          showOnMain: true,
        } as any);
      }
    })();
  }

  @Get()
  async getAllNews(req: Request, resp: Response) {
    try {
      const news = await this.newsService.getAllNews(req.query);

      resp.json(news);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get(':id')
  async getNews(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const news = await this.newsService.getNews(id);

      resp.status(HttpStatus.OK).json(news);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('by-url/:url')
  async getNewsByUrl(req: Request, resp: Response) {
    const { url } = req.params;
    try {
      const news = await this.newsService.getNewsByUrl(url);

      resp.status(HttpStatus.OK).json(news);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post('')
  @Middleware([verifyToken, isAdmin])
  async createNews(req: Request, resp: Response) {
    try {
      const news = await this.newsService.getAllNews({ limit: 100 });

      if (news.length == 0) {
        const initiated = await this.newsService.createNews({
          title: 'news title',
          url: 'news_url',
          post: '{"blocks":[{"key":"44ern","text":"news","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
          showOnMain: true,
        } as any);

        resp.status(HttpStatus.CREATED).json({ initiated });
      }

      const created = await this.newsService.createNews(req.body);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error: any) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateNews(req: Request, resp: Response) {
    try {
      const { id } = req.params;
      const updated = await this.newsService.updateNews(id, req.body);

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async deleteNews(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const removed = await this.newsService.removeNews(id);
      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong ${error}` });
    }
  }
}
