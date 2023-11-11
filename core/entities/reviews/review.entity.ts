import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Min, Max, IsNotEmpty } from 'class-validator';
import { Comment } from './comment.entity';
import { ReactionReview } from './reactionReview.entity';

@Entity()
export class Review {
  @Column({ unique: true })
  id: string;

  @Min(1)
  @Max(5)
  @IsNotEmpty()
  @Column()
  rating: number;

  @IsNotEmpty()
  @Column('text')
  text: string;

  @Column({ default: false })
  showOnMain: boolean;

  @Column({ default: '' })
  images: string;

  @IsNotEmpty()
  @PrimaryColumn()
  productId: string;

  @IsNotEmpty()
  @PrimaryColumn()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.review)
  comments: Comment[];

  @OneToMany(() => ReactionReview, (reaction) => reaction.review)
  reactions: ReactionReview[];

  constructor(args?: { rating: number, text: string, showOnMain: boolean, productId: string, comments: Comment[], images: string }) {
    if (args) {
      this.rating = args.rating;
      this.text = args.text;
      this.showOnMain = args.showOnMain;
      this.productId = args.productId;
      this.comments = args.comments;
      this.images = args.images;
    }
  }
}
