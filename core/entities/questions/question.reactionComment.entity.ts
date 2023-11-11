import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { QuestionComment } from './question.comment.entity';
import { Reaction } from '../../enums/reaction.enum';

@Entity()
export class QuestionReactionComment {
  @Column({ unique: true })
  id: string;

  @IsNotEmpty()
  @PrimaryColumn()
  userId: string;

  @ManyToOne(() => QuestionComment, comment => comment.reactions, { cascade: true, onDelete: 'CASCADE' })
  @PrimaryColumn()
  commentId: string;

  @Column({ type: 'enum', enum: Reaction })
  reaction: Reaction;

  constructor(args?: { userId: string; commentId: string; reaction: Reaction }) {
    if (args) {
      this.userId = args.userId;
      this.commentId = args.commentId;
      this.reaction = args.reaction;
    }
  }
}
