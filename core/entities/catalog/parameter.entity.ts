import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { IsNotEmpty } from 'class-validator';
import { ParameterProducts } from './parameterProducts.entity';
import { Product } from './product.entity';

@Entity()
export class Parameter {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column()
  name: string;

  @ManyToOne(
    () => Category,
    (category) => category.parameters,
    { cascade: true, onDelete: 'CASCADE' },
  )
  category: Category

  @OneToMany(() => ParameterProducts, (parameterProducts) => parameterProducts.parameter)
  parameterProducts: ParameterProducts[]

  constructor(args?: { name: string, category: Category }) {
    if (args) {
      this.name = args.name;
      this.category = args.category;
    }
  }
}
