import {
  Column, CreateDateColumn,
  Entity, JoinColumn, ManyToOne,
  OneToOne, PrimaryColumn,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Review } from './review.entity';
import { Reaction } from '../../enums/reaction.enum';

@Entity()
export class ReactionReview {

  @Column({ unique: true })
  id: string

  @IsNotEmpty()
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  reviewId: string

  @ManyToOne(() => Review, (review) => review.reactions, { cascade: true, onDelete: 'CASCADE' })
  review: Review

  @Column({type: 'enum', enum: Reaction })
  reaction: Reaction

  constructor(args?: {id: string, userId: string, review: Review, reaction: Reaction }) {
    if (args) {
      this.id = args.id;
      this.userId = args.userId;
      this.review = args.review;
      this.reaction = args.reaction;
      this.reviewId = args.review.id;
    }
  }
}
