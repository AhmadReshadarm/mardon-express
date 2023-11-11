import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';

@Entity()
export class News {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column()
  title: string;

  @IsNotEmpty()
  @Column({ unique: true })
  url: string;

  @Column('text', { nullable: true })
  description: string;

  @IsNotEmpty()
  @Column('text')
  post: string;

  @Column({ default: '' })
  image: string;

  @Column({ default: false })
  showOnMain: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(args?: {
    title: string;
    url: string;
    description: string;
    post: string;
    image: string;
    showOnMain: boolean;
  }) {
    if (args) {
      this.title = args.title;
      this.url = args.url;
      this.description = args.description;
      this.post = args.post;
      this.image = args.image;
      this.showOnMain = args.showOnMain;
    }
  }
}
