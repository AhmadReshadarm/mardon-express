import { DataSource } from 'typeorm';
import {
  Basket,
  Category,
  Checkout,
  Color,
  Comment,
  OrderProduct,
  Parameter,
  ParameterProducts,
  Product,
  ProductVariant,
  ReactionComment,
  ReactionReview,
  Review,
  Subscription,
  Tag,
  Address,
  User,
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
  entities: [
    OrderProduct,
    Basket,
    Address,
    Checkout,
    Subscription,
    // products decoupeled entities
    Product,
    Category,
    Color,
    Parameter,
    Tag,
    ParameterProducts,
    ProductVariant,
    Review,
    Comment,
    ReactionComment,
    ReactionReview,
    // users data soucrce
    User,
  ],
});

export default dataSource;
