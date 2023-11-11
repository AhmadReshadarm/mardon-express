import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { Slide } from '../../core/entities';
import { validation } from '../../core/lib/validator';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { HttpStatus } from '../../core/lib/http-status';
import { MAX_SLIDES } from '../banner.config';

@singleton()
export class SlideService {
  private slideRepository: Repository<Slide>;

  constructor(dataSource: DataSource) {
    this.slideRepository = dataSource.getRepository(Slide);
  }

  async getSlides(): Promise<Slide[]> {
    return this.slideRepository.find();
  }

  async getSlide(id: string): Promise<Slide> {
    const slide = await this.slideRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });
    return slide;
  }

  async createSlide(slideDTO: Slide): Promise<Slide> {
    await this.validateMaxSlides();
    const newSlide = await validation(new Slide(slideDTO));

    return this.slideRepository.save(newSlide);
  }

  // async updateSlides(id: string, slidesDTO: Slide): Promise<any> {
  //   //     const slides = await this.getSlides();

  //   const slide = await this.slideRepository.findOne({
  //     where: {
  //       id: Equal(id),
  //     },
  //   });

  //   return this.slideRepository.save({
  //     ...slide,
  //     ...slidesDTO,
  //   });
  //   // for (const slide of slides) {
  //   //   await this.slideRepository.remove(slide);
  //   // }

  //   // const newSlides = [];

  //   // for (const slide of slidesDTO) {
  //   //   await this.validateMaxSlides();
  //   //   const newSlide = await validation(new Slide(slide));
  //   //   const created = await this.slideRepository.save(...newSlide);
  //   //   newSlides.push(created);
  //   // }

  //   // return newSlides;
  //   // const created = await this.slideRepository.save(...slidesDTO);
  // }

  async updateSlides(slidesDTO: Slide[]): Promise<Slide[]> {
    const slides = await this.getSlides();

    for (const slide of slidesDTO) {
      await validation(new Slide(slide));
    }

    for (const slide of slides) {
      await this.slideRepository.remove(slide);
    }

    const newSlides = [];

    for (const slide of slidesDTO) {
      await this.validateMaxSlides();
      const newSlide = await validation(new Slide(slide));
      const created = await this.slideRepository.save(newSlide);
      newSlides.push(created);
    }

    return newSlides;
  }

  async removeSlide(id: string) {
    const slide = await this.slideRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.slideRepository.remove(slide);
  }

  async validateMaxSlides() {
    const slidesQty = await this.slideRepository.count();
    if (slidesQty > MAX_SLIDES - 1) {
      throw new CustomExternalError([`Slides cannot be more than ${MAX_SLIDES}`], HttpStatus.BAD_REQUEST);
    }
  }
}
