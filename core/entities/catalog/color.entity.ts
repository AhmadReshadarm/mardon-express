import { IsNotEmpty } from 'class-validator';
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductVariant } from './productVariant.entity';

@Entity()
export class Color {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column()
  name: string;

  @OneToMany(() => ProductVariant, ProductVariant => ProductVariant.color)
  productVariants?: ProductVariant[];

  @IsNotEmpty()
  @Column({ unique: true })
  url: string;

  @IsNotEmpty()
  @Column()
  code: string;

  constructor(args?: { name: string; productVariants?: ProductVariant[]; url: string; code: string }) {
    if (args) {
      this.name = args.name;
      this.productVariants = args.productVariants;
      this.url = args.url;
      this.code = args.code;
    }
  }
}
