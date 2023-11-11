import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { Advertisement } from '../../core/entities';
import { validation } from '../../core/lib/validator';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { HttpStatus } from '../../core/lib/http-status';
import { MAX_ADVERTISEMENTS } from '../banner.config';

@singleton()
export class AdvertisementService {
  private advertisementRepository: Repository<Advertisement>;

  constructor(dataSource: DataSource) {
    this.advertisementRepository = dataSource.getRepository(Advertisement);
  }

  async getAdvertisements(): Promise<Advertisement[]> {
    return this.advertisementRepository.find();
  }

  async getAdvertisement(id: string): Promise<Advertisement> {
    const advertisement = await this.advertisementRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });
    return advertisement;
  }

  async createAdvertisement(advertisementDTO: Advertisement): Promise<Advertisement> {
    await this.validateMaxAdvertisements();
    const newAdvertisement = await validation(new Advertisement(advertisementDTO));

    return this.advertisementRepository.save(newAdvertisement);
  }

  async updateAdvertisement(id: string, advertisementDTO: Advertisement) {
    const advertisement = await this.advertisementRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.advertisementRepository.save({
      ...advertisement,
      ...advertisementDTO,
    });
  }

  async removeAdvertisement(id: string) {
    const advertisement = await this.advertisementRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.advertisementRepository.remove(advertisement);
  }

  async validateMaxAdvertisements() {
    const advertisementsQty = await this.advertisementRepository.count();
    if (advertisementsQty > MAX_ADVERTISEMENTS - 1) {
      throw new CustomExternalError(
        [`Advertisements cannot be more than ${MAX_ADVERTISEMENTS}`],
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
