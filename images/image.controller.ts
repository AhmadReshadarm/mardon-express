import { Request, Response, Router } from 'express';
import { singleton } from 'tsyringe';
import { ImageService } from './image.service';
import multer from './middlewares/multer';
import { ImageDto } from './image.dto';
import { DESTINATION } from './config';
import { Controller, Delete, Get, Middleware, Post } from '../core/decorators';
import { createDestination } from './middlewares/create.destination';
import { isAdmin, isUser, verifyToken } from '../core/middlewares';
import { HttpStatus } from '../core/lib/http-status';
import fs from 'fs';
import axios from 'axios';
import sharp from 'sharp';

@singleton()
@Controller('/images')
export class ImageController {
  constructor(private imageService: ImageService) {}

  @Get()
  @Middleware([verifyToken, isAdmin])
  async getImages(req: Request, resp: Response) {
    try {
      const images = await this.imageService.getImages(req.query as any);
      resp.status(HttpStatus.OK).json(images);
    } catch (error: any) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error.message);
    }
  }

  @Get('editor')
  @Middleware([verifyToken, isAdmin])
  async getImagesAll(req: Request, resp: Response) {
    try {
      const images = await this.imageService.getImages(req.query as any);
      resp.status(HttpStatus.OK).json(
        images.rows.map((image, index) => ({
          url: `/api/images/${image.filename}`,
          thumb: `/api/images/${image.filename}`,
          id: image.id,
          list: images.rows[index],
        })),
      );
    } catch (error: any) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error.message);
    }
  }

  @Post()
  @Middleware([verifyToken, isUser, createDestination, multer.array('files')])
  async uploadImages(req: Request, resp: Response) {
    const files: ImageDto[] = (req as any).files ?? [];
    const imagesCoverted: ImageDto[] = [];
    function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    try {
      files.map(async image => {
        const sections = image.filename.split('.');
        const filename = sections[0];
        const path = `./files/${filename}.webp`;
        sharp(image.path)
          .webp({ lossless: false })
          .toFile(path, error => {
            if (error) {
              console.log(error);
            }
            imagesCoverted.push({
              filename: `${filename}.webp`,
              originalname: image.originalname,
              mimetype: image.mimetype,
              size: image.size,
            });
          });
      });

      await sleep(1000);
      files.map(image => {
        fs.unlinkSync(`${DESTINATION}/${image.filename}`);
      });
      await this.imageService.uploadImages(imagesCoverted);
      resp.json(imagesCoverted.map(image => image.filename));
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get(':fileName')
  async getImage(req: Request, resp: Response) {
    const { fileName } = req.params;
    try {
      if (!fs.existsSync(`${DESTINATION}/${fileName}`)) {
        // await this.imageService.removeImage(fileName);
        resp.status(HttpStatus.NOT_FOUND).json({ message: 'the file your looking for does not exist' });
        return;
      }
      resp.sendFile(fileName, { root: DESTINATION });
    } catch (error: any) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete(':fileName')
  @Middleware([verifyToken, isAdmin])
  async deleteImage(req: Request, resp: Response) {
    const { fileName } = req.params;
    let endpoints = [
      `${process.env.PRODUCT_DB}/products?image=${fileName}`,
      // `${process.env.PRODUCT_DB}/brands?image=${fileName}`,
      `${process.env.PRODUCT_DB}/categories?image=${fileName}`,
    ];

    await axios
      .all(endpoints.map(endpoint => axios.get(endpoint)))
      .then(
        axios.spread(async ({ data: products }, { data: categories }) => {
          if (products.length > 0 || categories.length > 0) {
            resp.status(HttpStatus.FORBIDDEN).json({ products, categories });
            return;
          }
          const removed = await this.imageService.removeImage(fileName);
          fs.unlink(`${DESTINATION}/${fileName}`, err => {
            if (err) {
              resp.status(HttpStatus.NOT_FOUND).json(err);
              return;
            }
            resp.status(HttpStatus.OK).json(removed);
          });
        }),
      )
      .catch(error => {
        resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(`${error}`);
      });
  }
  // @Delete('/inner:fileName')
  // async deleteImageInner(req: Request, resp: Response) {
  //   const { fileName } = req.params;
  //   let endpoints = [
  //     `${process.env.PRODUCT_DB}/products?image=${fileName}`,
  //     `${process.env.PRODUCT_DB}/brands?image=${fileName}`,
  //     `${process.env.PRODUCT_DB}/categories?image=${fileName}`,
  //   ];

  //   await axios
  //     .all(endpoints.map(endpoint => axios.get(endpoint)))
  //     .then(
  //       axios.spread(async ({ data: products }, { data: brands }, { data: categories }) => {
  //         if (products.length > 0 || brands.length > 0 || categories.length > 0) {
  //           resp.status(HttpStatus.FORBIDDEN).json({ products, brands, categories });
  //           return;
  //         }
  //         const removed = await this.imageService.removeImage(fileName);
  //         fs.unlink(`${DESTINATION}/${fileName}`, err => {
  //           if (err) {
  //             resp.status(HttpStatus.NOT_FOUND).json({ message: 'the file your looking for does not exist' });
  //             return;
  //           }
  //           resp.status(HttpStatus.OK).json(removed);
  //         });
  //       }),
  //     )
  //     .catch(error => {
  //       resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
  //     });
  // }
}
