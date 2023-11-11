import { Role } from '../core/enums/roles.enum';
import { QuestionComment, ReactionQuestion, Question } from '../core/entities';
import { QuestionReactionComment } from '../core/entities/questions/question.reactionComment.entity';
import { Reaction } from '../core/enums/reaction.enum';

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface ProductDTO {
  name: string;
  price: number;
  desc?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionDTO {
  id: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  product: ProductDTO | string;
  user: any;
  comments: QuestionComment[];
  reactions: ReactionQuestion[];
}

export interface QuestionQueryDTO {
  id?: string;
  productId?: string;
  userId?: string;
  sortBy?: 'productId' | 'userId';
  orderBy?: 'DESC' | 'ASC';
  limit?: number;
  offset?: number;
  merge?: string;
}

export interface CommentQueryDTO {
  id?: string;
  userId?: string;
  orderBy?: 'DESC' | 'ASC';
  limit?: number;
  offset?: number;
}

export interface CommentDTO {
  id: string;
  user: UserDTO | string;
  question: Question;
  text: String;
  createdAt: Date;
  updatedAt: Date;
  reactions: QuestionReactionComment[];
}

export interface CreateCommentDTO {
  userId: string;
  text: string;
  questionId: string;
}

export interface UserAuth {
  id: string;
  role: Role;
}

export interface CreateReactionDTO {
  id: string;
  userId: string;
  reaction: Reaction;
  questionId: string;
}
