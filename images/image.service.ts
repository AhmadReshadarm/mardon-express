import { singleton } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';
import { Image } from '../core/entities';
import { ImageDto, ImageQueryDTO } from './image.dto';
import { PaginationDTO } from '../core/lib/dto';
@singleton()
export class ImageService {
  private imageRepository: Repository<Image>;

  constructor(dataSource: DataSource) {
    this.imageRepository = dataSource.getRepository(Image);
  }

  async getImages(queryParams: ImageQueryDTO): Promise<PaginationDTO<Image>> {
    const {
      filename,
      originalName,
      mimeType,
      size,
      sortBy = 'id',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = await this.imageRepository.createQueryBuilder('image');

    if (filename) {
      queryBuilder.andWhere('image.filename LIKE :filename', { filename: `%${filename}%` });
    }
    if (originalName) {
      queryBuilder.andWhere('image.originalName LIKE :originalName', { originalName: `%${originalName}%` });
    }
    if (mimeType) {
      queryBuilder.andWhere('image.mimeType LIKE :mimeType', { mimeType: `%${mimeType}%` });
    }
    if (size) {
      queryBuilder.andWhere('image.size LIKE :size', { size: `%${size}%` });
    }

    queryBuilder.orderBy(`image.${sortBy}`, orderBy).skip(offset).take(limit);
    return {
      rows: await queryBuilder.getMany(),
      length: await queryBuilder.getCount(),
    };
  }

  async removeImage(fileName: string) {
    const image = await this.imageRepository.findOneOrFail({
      where: {
        filename: fileName,
      },
    });
    return this.imageRepository.remove(image);
  }

  async uploadImages(newImages: ImageDto[]): Promise<void> {
    const imagePromises = newImages.map(image => {
      //
      return this.imageRepository.save({
        filename: image.filename,
        originalName: image.originalname,
        mimeType: image.mimetype,
        size: image.size,
      });
    });
    await Promise.all(imagePromises);
  }
}
