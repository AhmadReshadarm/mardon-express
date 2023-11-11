import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { QuestionComment, QuestionReactionComment, Question } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { CommentQueryDTO, UserAuth, UserDTO, CommentDTO, CreateCommentDTO, QuestionDTO } from '../questions.dtos';
import axios from 'axios';
import { scope } from '../../core/middlewares/access.user';
import { Role } from '../../core/enums/roles.enum';
import { PaginationDTO } from '../../core/lib/dto';

@singleton()
export class CommentService {
  private commentRepository: Repository<QuestionComment>;
  private questionRepository: Repository<Question>;
  private reactionRepository: Repository<QuestionReactionComment>;

  constructor(dataSource: DataSource) {
    this.commentRepository = dataSource.getRepository(QuestionComment);
    this.questionRepository = dataSource.getRepository(Question);
    this.reactionRepository = dataSource.getRepository(QuestionReactionComment);
  }

  async getComments(queryParams: CommentQueryDTO): Promise<PaginationDTO<CommentDTO>> {
    const { userId, orderBy = 'DESC', offset = 0, limit = 10 } = queryParams;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.question', 'question')
      .leftJoinAndSelect('comment.reactions', 'reactions');

    if (userId) {
      queryBuilder.andWhere('comment.userId = :userId', { userId: userId });
    }

    queryBuilder.orderBy(`comment.userId`, orderBy).skip(offset).take(limit);

    const comments = await queryBuilder.getMany();
    const result = comments.map(async comment => await this.mergeCommentUserId(comment));

    return {
      rows: await Promise.all(result),
      length: await queryBuilder.getCount(),
    };
  }

  async getComment(id: string): Promise<CommentDTO> {
    const comment = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.question', 'question')
      .leftJoinAndSelect('comment.reactions', 'reactions')
      .where('comment.id = :id', { id: id })
      .getOneOrFail();

    return await this.mergeCommentUserId(comment);
  }

  async getUserById(id: string): Promise<UserDTO | undefined> {
    const options = {
      url: `${process.env.USERS_DB}/users/inner/${id}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      data: {
        secretKey: process.env.INNER_AUTH_CALL_SECRET_KEY,
      },
    };
    try {
      const res = await axios(options);
      return res.data;
    } catch (e: any) {
      if (e.name === 'AxiosError' && e.response.status === 403) {
        throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
      }
    }
  }

  async getQuestion(id: string) {
    return this.questionRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });
  }

  async getNewReactionId(): Promise<string> {
    const lastElement = await this.reactionRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });

    return lastElement[0] ? String(+lastElement[0].id + 1) : String(1);
  }

  async createComment(commentDTO: CreateCommentDTO): Promise<CommentDTO> {
    this.validation(commentDTO);
    const question = await this.getQuestion(commentDTO.questionId);

    const newComment = new QuestionComment({
      userId: commentDTO.userId,
      question: question,
      text: commentDTO.text,
    });

    const created = await this.commentRepository.save(newComment);
    return await this.mergeCommentUserId(created);
  }

  async createReaction(reaction: QuestionReactionComment): Promise<QuestionReactionComment> {
    return this.reactionRepository.save(reaction);
  }

  async updateComment(id: string, commentDTO: CreateCommentDTO, user: UserAuth, authToken: string) {
    const comment = await this.getComment(id);
    const { questionId, ...others } = commentDTO;

    const newComment: QuestionComment = {
      ...comment,
      ...others,
    };
    this.isUserCommentOwner(newComment, user);
    await this.commentRepository
      .createQueryBuilder()
      .update()
      .set({
        text: commentDTO.text,
      })
      .where('id = :id', { id: id })
      .execute();
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.question', 'question')
      .leftJoinAndSelect('comment.reactions', 'reactions');
    if (questionId) {
      queryBuilder.andWhere('question.id = :id', { id: questionId });
    }

    queryBuilder.orderBy(`comment.createdAt`, 'ASC').skip(0).take(1000);
    const comments = await queryBuilder.getMany();
    const result = comments.map(async comment => await this.mergeCommentUserId(comment));
    return await Promise.all(result);
  }

  async removeComment(id: string, user: UserAuth) {
    const comment = await this.commentRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['question'],
    });

    await this.isUserCommentOwner(comment, user);
    await this.commentRepository.remove(comment);

    return {
      ...comment,
      id,
    };
  }

  async removeReaction(id: string, user: UserAuth) {
    const reaction = await this.reactionRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
      relations: ['commentId'],
    });

    await this.isUserReactionOwner(reaction, user);
    await this.reactionRepository.remove({
      ...reaction,
      commentId: (reaction.commentId as any).id,
    });

    return {
      ...reaction,
      commentId: (reaction.commentId as any).id,
    };
  }

  isUserCommentOwner(comment: QuestionComment, user: UserAuth) {
    if (scope(String(comment.userId), String(user.id)) && user.role !== Role.Admin) {
      throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
  }

  isUserReactionOwner(reaction: QuestionReactionComment, user: UserAuth) {
    if (scope(String(reaction.userId), String(user.id)) && user.role !== Role.Admin) {
      throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
  }

  validation(newComment: CreateCommentDTO) {
    if (!newComment.userId || !newComment.questionId || !newComment.text) {
      throw new CustomExternalError([ErrorCode.VALIDATION_QUESTION_COMMENTS], HttpStatus.BAD_REQUEST);
    }
  }

  async mergeCommentUserId(comment: QuestionComment): Promise<CommentDTO> {
    return {
      id: comment.id,
      user: (await this.getUserById(comment.userId)) ?? comment.userId,
      question: comment.question,
      text: comment.text,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      reactions: comment.reactions,
    };
  }
}
