import { IsNotEmpty } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductVariant } from './productVariant.entity';

@Entity()
export class Artical {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column()
  name: string;

  @OneToMany(() => ProductVariant, ProductVariant => ProductVariant.artical)
  productVariants?: ProductVariant[];

  @IsNotEmpty()
  @Column({ unique: true })
  url: string;

  constructor(args?: { name: string; productVariants?: ProductVariant[]; url: string }) {
    if (args) {
      this.name = args.name;
      this.productVariants = args.productVariants;
      this.url = args.url;
    }
  }
}
