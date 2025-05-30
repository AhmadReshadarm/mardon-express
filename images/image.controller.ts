import { Request, Response, Router } from 'express';
import { singleton } from 'tsyringe';
import { ImageService } from './image.service';
import multer from './middlewares/multer';
import { ImageDto } from './image.dto';
import { DESTINATION, DESTINATION_COMPRESSED } from './config';
import { Controller, Delete, Get, Middleware, Post } from '../core/decorators';
import { createDestination, createDestinationCompressed } from './middlewares/create.destination';
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

  // @Post()
  // @Middleware([verifyToken, isUser, createDestination, multer.array('files')])
  // async uploadImages(req: Request, resp: Response) {
  //   const files: ImageDto[] = (req as any).files ?? [];
  //   const imagesCoverted: ImageDto[] = [];
  //   function sleep(ms: number) {
  //     return new Promise(resolve => setTimeout(resolve, ms));
  //   }
  //   try {
  //     files.map(async image => {
  //       const sections = image.filename.split('.');
  //       const filename = sections[0];
  //       const path = `./files/${filename}.webp`;
  //       sharp(image.path)
  //         .webp({ lossless: false })
  //         .toFile(path, error => {
  //           if (error) {
  //             console.log(error);
  //           }
  //           imagesCoverted.push({
  //             filename: `${filename}.webp`,
  //             originalname: image.originalname,
  //             mimetype: image.mimetype,
  //             size: image.size,
  //           });
  //         });
  //     });

  //     await sleep(1000);
  //     files.map(image => {
  //       fs.unlinkSync(`${DESTINATION}/${image.filename}`);
  //     });
  //     await this.imageService.uploadImages(imagesCoverted);
  //     resp.json(imagesCoverted.map(image => image.filename));
  //   } catch (error) {
  //     resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
  //   }
  // }

  @Post()
  @Middleware([verifyToken, isUser, createDestination, multer.array('files')])
  async uploadImages(req: Request, resp: Response) {
    const files: ImageDto[] = (req as any).files ?? [];
    const imagesConverted: ImageDto[] = [];
    const conversionPromises: Promise<void>[] = [];

    try {
      for (const image of files) {
        const sections = image.filename.split('.');
        const baseFilename = sections[0];
        const webpPath = `./files/${baseFilename}.webp`; // Path for the converted WebP image

        const conversionPromise = sharp(image.path)
          .webp({ lossless: false })
          .toFile(webpPath)
          .then(() => {
            imagesConverted.push({
              filename: `${baseFilename}.webp`, // Store the WebP filename
              originalname: image.originalname,
              mimetype: 'image/webp', // Update mimetype
              size: fs.statSync(webpPath).size, // Get the size of the converted file
            });
            // Optionally, you can delete the original file here if you don't need it
            fs.unlinkSync(image.path!);
          })
          .catch(error => {
            console.error(`Error converting ${image.originalname}:`, error);
            // If one conversion fails, you might want to handle it (e.g., remove from processing)
            // For this example, we'll let the Promise.all reject if any fail.
            throw error; // Re-throw the error to reject the promise
          });

        conversionPromises.push(conversionPromise);
      }

      await Promise.all(conversionPromises); // Wait for all conversions (and optional deletions) to complete successfully
      await this.imageService.uploadImages(imagesConverted);
      resp.json(imagesConverted.map(img => img.filename)); // Respond with the WebP filenames
    } catch (error) {
      console.error('Image upload process failed:', error);
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    } finally {
      // Optional: Clean up any remaining original files if an error occurred
      // This might be necessary depending on your error handling strategy.
      for (const image of files) {
        if (fs.existsSync(image.path!)) {
          fs.unlinkSync(image.path!);
        }
      }
    }
  }

  @Get(':fileName')
  async getImage(req: Request, resp: Response) {
    const { fileName } = req.params;
    try {
      if (!fs.existsSync(`${DESTINATION}/${fileName}`)) {
        resp.status(HttpStatus.NOT_FOUND).json({ message: 'the file your looking for does not exist' });
        return;
      }
      resp.setHeader('content-Type', 'image/webp');
      resp.setHeader('Cache-Control', 'public, max-age=31536000');

      resp.sendFile(fileName, { root: DESTINATION });
    } catch (error: any) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('compress/:fileName')
  @Middleware([createDestinationCompressed])
  async getCompressedImage(req: Request, resp: Response) {
    const { fileName } = req.params;
    const { qlty, width, height, lossless } = req.query;

    try {
      if (!fs.existsSync(`${DESTINATION}/${fileName}`)) {
        resp.status(HttpStatus.NOT_FOUND).json({ message: 'the file your looking for does not exist' });
        return;
      }

      const webp = await sharp(`${DESTINATION}/${fileName}`);
      if (width && height) {
        webp
          .webp({ lossless: Boolean(lossless), quality: Number(qlty) })
          .resize(Number(width), Number(height), { fit: 'inside' })
          .toFile(`${DESTINATION_COMPRESSED}/thumbnail-${fileName}`)
          .then(() => {
            resp.setHeader('content-Type', 'image/webp');
            resp.setHeader('Cache-Control', 'public, max-age=31536000');
            resp.sendFile(`thumbnail-${fileName}`, { root: DESTINATION_COMPRESSED });
          })
          .catch(error => {
            console.log(error);
          });
        return;
      }
      webp
        .webp({ lossless: false, quality: Number(qlty) })
        .toFile(`${DESTINATION_COMPRESSED}/${fileName}`)
        .then(() => {
          resp.setHeader('content-Type', 'image/webp');
          resp.setHeader('Cache-Control', 'public, max-age=31536000');
          resp.sendFile(fileName, { root: DESTINATION_COMPRESSED });
        })
        .catch(error => {
          console.log(error);
        });
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
