import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { WishlistProduct } from './whishlistProduct.entity';

@Entity()
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @OneToMany(() => WishlistProduct, wishlistProduct => wishlistProduct.wishlist)
  items: WishlistProduct[];

  constructor(args?: { items: WishlistProduct[] }) {
    if (args) {
      this.items = args.items;
    }
  }
}
