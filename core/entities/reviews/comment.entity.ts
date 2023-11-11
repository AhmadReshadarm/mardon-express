import {
  Column, CreateDateColumn,
  Entity, JoinColumn, ManyToOne, OneToMany,
  OneToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Review } from './review.entity';
import { IsNotEmpty } from 'class-validator';
import { ReactionComment } from './reactionComment.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => Review, (review) => review.comments, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  review: Review;

  @IsNotEmpty()
  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ReactionComment, (reaction) => reaction.commentId)
  reactions: ReactionComment[]

  constructor(args?: { userId: string, review: Review, text: string }) {
    if (args) {
      this.userId = args.userId;
      this.review = args.review;
      this.text = args.text;
    }
  }
}
