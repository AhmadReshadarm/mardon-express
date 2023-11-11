import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { IsNotEmpty } from 'class-validator';
import { QuestionReactionComment } from './question.reactionComment.entity';

@Entity()
export class QuestionComment {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => Question, question => question.comments, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  question: Question;

  @IsNotEmpty()
  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => QuestionReactionComment, reaction => reaction.commentId)
  reactions: QuestionReactionComment[];

  constructor(args?: { userId: string; question: Question; text: string }) {
    if (args) {
      this.userId = args.userId;
      this.question = args.question;
      this.text = args.text;
    }
  }
}
