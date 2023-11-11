import { SlideController } from './slides/slide.controller';
import { AdvertisementController } from './advertisements/advertisement.controller';


const loadControllers = () => {
  return [
    SlideController,
    AdvertisementController
  ];
}

export default loadControllers;
