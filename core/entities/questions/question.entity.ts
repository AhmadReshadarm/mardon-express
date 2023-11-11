import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { QuestionComment } from './question.comment.entity';
import { ReactionQuestion } from './reactionQesstion.entity';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: string;

  @IsNotEmpty()
  @Column('text')
  text: string;

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

  @OneToMany(() => QuestionComment, comment => comment.question)
  comments: QuestionComment[];

  @OneToMany(() => ReactionQuestion, reaction => reaction.question)
  reactions: ReactionQuestion[];

  constructor(args?: { text: string; productId: string; comments: QuestionComment[] }) {
    if (args) {
      this.text = args.text;
      this.productId = args.productId;
      this.comments = args.comments;
    }
  }
}
