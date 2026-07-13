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

  @IsNotEmpty()
  @Column({ unique: true })
  url: string;

  @Column({ default: true })
  publish: boolean;

  @IsNotEmpty()
  @Column({ default: 0 })
  avrgRating: number;

  @IsNotEmpty()
  @Column({ default: 0 })
  reviewCount: number;

  @IsNotEmpty()
  @Column({ default: 0 })
  questionCount: number;

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
    publish: boolean;
    avrgRating: number;
    reviewCount: number;
    questionCount: number;
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
      this.publish = args.publish;
      this.avrgRating = args.avrgRating;
      this.reviewCount = args.reviewCount;
      this.questionCount = args.questionCount;
      this.tags = args.tags;
      this.parameterProducts = args.parameterProducts;
      this.productVariants = args.productVariants;
    }
  }
}
