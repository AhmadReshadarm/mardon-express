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
import { Question } from './question.entity';
import { Reaction } from '../../enums/reaction.enum';

@Entity()
export class ReactionQuestion {
  @Column({ unique: true })
  id: string;

  @IsNotEmpty()
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  questionId: string;

  @ManyToOne(() => Question, question => question.reactions, { cascade: true, onDelete: 'CASCADE' })
  question: Question;

  @Column({ type: 'enum', enum: Reaction })
  reaction: Reaction;

  constructor(args?: { id: string; userId: string; question: Question; reaction: Reaction }) {
    if (args) {
      this.id = args.id;
      this.userId = args.userId;
      this.question = args.question;
      this.reaction = args.reaction;
      this.questionId = args.question.id;
    }
  }
}
