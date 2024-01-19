import { IsNotEmpty } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { ParameterProducts } from './parameterProducts.entity';
import { ProductVariant } from './productVariant.entity';
import { Tag } from './tag.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column()
  name: string;

  @Column('text', { nullable: true })
  desc: string;
  @Column('text', { nullable: true })
  shortDesc: string;
  @Column('text', { nullable: true })
  keywords: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsNotEmpty()
  @ManyToOne(() => Category, category => category.id, { nullable: false, cascade: true, onDelete: 'CASCADE' })
  category: Category;

  // @IsNotEmpty()
  // @ManyToOne(() => Brand, brand => brand.id, { nullable: false, cascade: true, onDelete: 'CASCADE' })
  // brand: Brand;

  @IsNotEmpty()
  @Column({ unique: true })
  url: string;

  @ManyToMany(() => Tag, tag => tag.products, { cascade: true, nullable: true })
  @JoinTable()
  tags?: Tag[];

  @OneToMany(() => ParameterProducts, parameterProducts => parameterProducts.product)
  parameterProducts: ParameterProducts[];

  @OneToMany(() => ProductVariant, productVariant => productVariant.product)
  productVariants: ProductVariant[];

  constructor(args?: {
    name: string;
    desc: string;
    shortDesc: string;
    keywords: string;
    category: Category;
    url: string;
    // brand: Brand;
    tags?: Tag[];
    parameterProducts: ParameterProducts[];
    productVariants: ProductVariant[];
  }) {
    if (args) {
      this.name = args.name;
      this.desc = args.desc;
      this.shortDesc = args.shortDesc;
      this.keywords = args.keywords;
      this.category = args.category;
      this.url = args.url;
      // this.brand = args.brand;
      this.tags = args.tags;
      this.parameterProducts = args.parameterProducts;
      this.productVariants = args.productVariants;
    }
  }
}
