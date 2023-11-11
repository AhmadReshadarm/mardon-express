import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { AdvertisementService } from './advertisement.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, verifyToken } from '../../core/middlewares';

@singleton()
@Controller('/advertisements')
export class AdvertisementController {
  constructor(private advertisementService: AdvertisementService) {
    (async () => {
      try {
        const advertisements = await this.advertisementService.getAdvertisements();

        if (!advertisements.length) {
          await this.advertisementService.createAdvertisement({
            title: 'title',
            description: 'this is description',
          } as any);
        }
      } catch (error) {
        console.log(error);
      }
    })();
  }

  @Get()
  async getAdvertisements(req: Request, resp: Response) {
    const advertisements = await this.advertisementService.getAdvertisements();

    resp.json(advertisements);
  }

  @Get(':id')
  async getAdvertisement(req: Request, resp: Response) {
    const { id } = req.params;
    const advertisement = await this.advertisementService.getAdvertisement(id);

    resp.json(advertisement);
  }

  @Post('')
  @Middleware([verifyToken, isAdmin])
  async createAdvertisement(req: Request, resp: Response) {
    const advertisements = await this.advertisementService.getAdvertisements();

    if (!advertisements.length) {
      const created = await this.advertisementService.createAdvertisement({
        title: '',
        description: '',
      } as any);

      resp.status(HttpStatus.CREATED).json({ created });
    }

    resp.status(HttpStatus.CREATED).json({ advertisements });
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateAdvertisement(req: Request, resp: Response) {
    const { id } = req.params;
    const updated = await this.advertisementService.updateAdvertisement(id, req.body);

    resp.status(HttpStatus.OK).json(updated);
  }

  // @Delete(':id')
  // @Middleware([verifyToken, isAdmin])
  // async removeAdvertisement(req: Request, resp: Response) {
  //   const { id } = req.params;
  //   const removed = await this.advertisementService.removeAdvertisement(id);

  //   resp.status(HttpStatus.OK).json(removed);
  // }
}
