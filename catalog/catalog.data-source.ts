import { DataSource } from 'typeorm';
import {
  // Brand,
  Category,
  Color,
  Parameter,
  ParameterProducts,
  Product,
  ProductVariant,
  Tag,
  // Size,
  // Foryou,
} from '../core/entities';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: 3306,
  username: 'root',
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  logging: true,
  synchronize: true,
  migrationsRun: false,
  entities: [Product, Category, Color, Parameter, Tag, ParameterProducts, ProductVariant],
});
// Size,
//  Foryou,
// Brand,
export default dataSource;
