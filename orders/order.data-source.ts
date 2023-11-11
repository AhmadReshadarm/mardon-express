import { DataSource } from 'typeorm';
import { Basket, Checkout, OrderProduct, Subscription } from '../core/entities';
import { Address } from '../core/entities';

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
  entities: [OrderProduct, Basket, Address, Checkout, Subscription],
});

export default dataSource;
