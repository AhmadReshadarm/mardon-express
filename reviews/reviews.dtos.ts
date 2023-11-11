import { Role } from '../core/enums/roles.enum';
import { Comment, ReactionReview, Review } from '../core/entities';
import { ReactionComment } from '../core/entities/reviews/reactionComment.entity';
import { Reaction } from '../core/enums/reaction.enum';

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ProductDTO {
  name: string;
  price: number;
  desc?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
  reviews: ReviewProdcutDTO[];
}

export interface ReviewProdcutDTO {
  id: string;
  rating: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  showOnMain: boolean;
  product: ProductDTO | string;
  user: UserDTO;
  comments: Comment[];
  reactions: ReactionReview[];
  images: string;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  showOnMain: boolean;
  product: ProductDTO | string;
  user: UserDTO | string;
  comments: Comment[];
  reactions: ReactionReview[];
  images: string;
}

export interface ReviewQueryDTO {
  id?: string;
  productId?: string;
  userId?: string;
  showOnMain?: boolean;
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
  review: Review;
  text: String;
  createdAt: Date;
  updatedAt: Date;
  reactions: ReactionComment[];
}

export interface CreateCommentDTO {
  userId: string;
  text: string;
  reviewId: string;
}

export interface UserAuth {
  id: string;
  role: Role;
}

export interface CreateReactionDTO {
  id: string;
  userId: string;
  reaction: Reaction;
  reviewId: string;
}
