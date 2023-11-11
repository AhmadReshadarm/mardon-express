import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Basket } from './basket.entity';
import { IsNotEmpty, Min } from 'class-validator';

@Entity()
export class OrderProduct {
  @Column({ unique: true })
  id: string;

  @IsNotEmpty()
  @PrimaryColumn()
  productId: string;

  @IsNotEmpty()
  @Min(1)
  @Column()
  qty: number;

  @Column()
  productPrice: number;

  @Column({ nullable: true })
  productSize: string;

  @IsNotEmpty()
  @PrimaryColumn({ nullable: false })
  basketId: string;

  @IsNotEmpty()
  @ManyToOne(() => Basket, basket => basket.orderProducts, { cascade: true, onDelete: 'CASCADE' })
  inBasket: Basket;

  @IsNotEmpty()
  @Column()
  productVariantId: string;

  constructor(args?: {
    productId: string;
    qty: number;
    productSize: string;
    inBasket: Basket;
    productVariantId: string;
  }) {
    if (args) {
      this.productId = args.productId;
      this.qty = args.qty;
      this.inBasket = args.inBasket;
      (this.productSize = args.productSize), (this.productVariantId = args.productVariantId);
      this.basketId = args.inBasket.id;
    }
  }
}
