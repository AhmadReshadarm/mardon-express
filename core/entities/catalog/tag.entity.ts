import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { IsNotEmpty } from 'class-validator';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column()
  name: string;

  @ManyToMany(() => Product, (product) => product.tags)
  products?: Product[];

  @IsNotEmpty()
  @Column({ unique: true })
  url: string;

  constructor(args?: { name: string, products?: Product[], url: string }) {
    if (args) {
      this.name = args.name;
      this.products = args.products;
      this.url = args.url;
    }
  }
}
