// import { BrandController } from './brands/brand.controller';
import { CategoryController } from './categories/category.controller';
import { ColorController } from './colors/color.controller';
import { ProductController } from './products/product.controller';
import { TagController } from './tags/tag.controller';
//
const loadControllers = () => {
  return [ProductController, CategoryController, ColorController, TagController];
};
// BrandController,
export default loadControllers;
