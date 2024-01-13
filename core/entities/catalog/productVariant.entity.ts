import { IsNotEmpty, IsPositive } from 'class-validator';
import { Column, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderProduct } from '../orders';
import { Color } from './color.entity';
import { Product } from './product.entity';
@Entity()
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column()
  @IsPositive()
  price: number;

  @Column({ nullable: true })
  oldPrice?: number;

  // @Column({ nullable: true })
  // wholeSalePrice?: number;

  @Column()
  artical: string;

  @IsNotEmpty()
  @Column({ default: false })
  available: boolean;

  @IsNotEmpty()
  @ManyToOne(() => Color, color => color.productVariants, { cascade: true, nullable: true })
  @JoinTable()
  color: Color;

  @Column('text', { nullable: true })
  images: string;

  @ManyToOne(() => Product, product => product.productVariants, { cascade: true, onDelete: 'CASCADE' })
  product: Product;

  constructor(args?: {
    price: number;
    available: boolean;
    color: Color;
    artical: string;
    oldPrice?: number;
    // wholeSalePrice?: number;
    images: string;
    product: Product;
    orderProducts: OrderProduct[];
  }) {
    if (args) {
      this.product = args.product;
      this.price = args.price;
      this.oldPrice = args.oldPrice;
      this.artical = args.artical;
      // this.wholeSalePrice = args.wholeSalePrice;
      this.available = args.available;
      this.color = args.color;
      this.images = args.images;
    }
  }
}
