import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Wishlist } from './wishlist.entity';

@Entity()
export class WishlistProduct {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column()
  productId: string;

  @IsNotEmpty()
  @ManyToOne(() => Wishlist, wishlish => wishlish.items, { cascade: true, onDelete: 'CASCADE' })
  wishlist: Wishlist;

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(args?: { productId: string, wishlist: Wishlist }) {
    if (args) {
      this.productId = args.productId;
      this.wishlist = args.wishlist;
    }
  }
}
