import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class Foryou {
  @PrimaryGeneratedColumn()
  id: string;
  @Column()
  userId: string;
  @OneToMany(() => Product, products => products.id)
  productIds: Product[];

  constructor(args?: { userId: string; productIds: Product[] }) {
    if (args) {
      this.userId = args.userId;
      this.productIds = args.productIds;
    }
  }
}
