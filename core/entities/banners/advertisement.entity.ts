import { Column, Entity, Generated, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Min, Max, IsNotEmpty, isNotEmpty } from 'class-validator';

@Entity()
export class Advertisement {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string;

  @IsNotEmpty()
  @Column('text')
  description: string;

  constructor(args?: { description: string; title: string }) {
    if (args) {
      this.title = args.title;
      this.description = args.description;
    }
  }
}
