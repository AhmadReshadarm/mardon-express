import { IsNotEmpty } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class Brand {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  image: string;

  @IsNotEmpty()
  @Column({ unique: true })
  url: string;

  @Column({ default: false })
  showOnMain: boolean;

  // @OneToMany(() => Product, product => product.brand)
  // products?: Product[];

  constructor(args?: { name: string; image: string; url: string; showOnMain: boolean }) {
    if (args) {
      this.name = args.name;
      this.image = args.image;
      this.url = args.url;
      this.showOnMain = args.showOnMain;
    }
  }
}
