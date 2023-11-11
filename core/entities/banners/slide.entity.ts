import { Column, Entity, Generated, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Min, Max, IsNotEmpty } from 'class-validator';

@Entity()
export class Slide {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column({ unique: true })
  image: string;

  @IsNotEmpty()
  @Column()
  link: string;

  constructor(args?: { image: string; link: string }) {
    if (args) {
      this.image = args.image;
      this.link = args.link;
    }
  }
}
