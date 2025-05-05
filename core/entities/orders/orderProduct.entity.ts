import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Basket } from './basket.entity';
import { IsNotEmpty, Min } from 'class-validator';

@Entity()
export class OrderProduct {
  // @Column({ unique: true })
  @PrimaryColumn({ unique: true })
  id: string;

  @IsNotEmpty()
  // @PrimaryColumn()
  @Column()
  productId: string;

  @IsNotEmpty()
  @Min(1)
  @Column()
  qty: number;

  @Column()
  productPrice: number;

  @IsNotEmpty()
  // @PrimaryColumn({ nullable: false })
  @Column({ nullable: false })
  basketId: string;

  @IsNotEmpty()
  @ManyToOne(() => Basket, basket => basket.orderProducts, { cascade: true, onDelete: 'CASCADE' })
  inBasket: Basket;

  @IsNotEmpty()
  @Column()
  productVariantId: string;

  constructor(args?: { productId: string; qty: number; inBasket: Basket; productVariantId: string }) {
    if (args) {
      this.productId = args.productId;
      this.qty = args.qty;
      this.inBasket = args.inBasket;
      this.productVariantId = args.productVariantId;
      this.basketId = args.inBasket.id;
    }
  }
}
