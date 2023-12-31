import { BrandController } from './brands/brand.controller';
import { CategoryController } from './categories/category.controller';
import { ColorController } from './colors/color.controller';
import { ProductController } from './products/product.controller';
import { TagController } from './tags/tag.controller';
import { SizeController } from './sizes/size.controller';
import { ArticalController } from './articals/artical.controller';

const loadControllers = () => {
  return [
    ProductController,
    CategoryController,
    ColorController,
    BrandController,
    TagController,
    SizeController,
    ArticalController,
  ];
};

export default loadControllers;
