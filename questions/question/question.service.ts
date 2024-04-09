import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { ReactionQuestion, Question } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { CreateReactionDTO, ProductDTO, QuestionDTO, QuestionQueryDTO, UserAuth, UserDTO } from '../questions.dtos';
import axios from 'axios';
import { scope } from '../../core/middlewares/access.user';
import { Role } from '../../core/enums/roles.enum';
import { PaginationDTO } from '../../core/lib/dto';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { CommentService } from '../comment/comment.service';

@singleton()
export class QuestionService {
  private questionRepository: Repository<Question>;
  private reactionRepository: Repository<ReactionQuestion>;

  constructor(dataSource: DataSource, private commentService: CommentService) {
    this.questionRepository = dataSource.getRepository(Question);
    this.reactionRepository = dataSource.getRepository(ReactionQuestion);
  }

  async getQuestions(queryParams: QuestionQueryDTO): Promise<PaginationDTO<QuestionDTO | Question>> {
    const {
      productId,
      userId,
      sortBy = 'createdAt',
      orderBy = 'DESC',
      merge = 'true',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.comments', 'comments')
      .leftJoinAndSelect('question.reactions', 'reactions')
      .leftJoinAndSelect('comments.reactions', 'commentReactions');

    if (productId) {
      queryBuilder.andWhere('question.productId = :productId', { productId: productId });
    }
    if (userId) {
      queryBuilder.andWhere('question.userId = :userId', { userId: userId });
    }

    queryBuilder.orderBy(`question.${sortBy}`, orderBy).skip(offset).take(limit);

    if (merge === 'true') {
      return {
        rows: await this.mergeQuestions(queryBuilder),
        length: await queryBuilder.getCount(),
      };
    }

    const questions = await queryBuilder.getMany();

    for (const question of questions) {
      const comments = [];
      for (const comment of question.comments) {
        const user = await this.getUserById(comment.userId);
        comments.push({
          ...comment,
          user,
        });
      }
      question.comments = comments;
    }

    return {
      rows: questions,
      length: await queryBuilder.getCount(),
    };
  }

  async getQuestion(id: string): Promise<QuestionDTO> {
    const question = await this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.comments', 'comments')
      .leftJoinAndSelect('question.reactions', 'reactions')
      .where('question.id = :id', { id: id })
      .getOneOrFail();

    return await this.mergeQuestionUserId(question);
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

  async getProductById(id: string): Promise<ProductDTO | undefined> {
    try {
      const res = await axios.get(`${process.env.CATALOG_DB}/products/${id}`);

      return res.data;
    } catch (e: any) {
      if (e.name !== 'AxiosError') {
        throw new Error(e);
      }
    }
  }

  async getNewQuestionId(): Promise<string> {
    const lastElement = await this.questionRepository.find({
      order: { id: 'DESC' },
      // take: 1,
    });

    const leatestElement = lastElement.sort(function (a, b) {
      return Number(b.id) - Number(a.id);
    });

    return lastElement[0] ? String(+leatestElement[0].id + 1) : String(1);
  }

  async getNewReactionId(): Promise<string> {
    const lastElement = await this.reactionRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });

    return lastElement[0] ? String(+lastElement[0].id + 1) : String(1);
  }
  //
  async createQuestion(newQuestion: Question): Promise<QuestionDTO> {
    const prodcutId = await this.getProductById(newQuestion.productId);
    if (!prodcutId) {
      throw new CustomExternalError([ErrorCode.PRODUCT_NOT_FOUND], HttpStatus.NOT_FOUND);
    }

    newQuestion.id = await this.getNewQuestionId();

    const created = await this.questionRepository.save(newQuestion);
    const fullQuestion = await this.getQuestion(created.id);

    return fullQuestion;
  }

  async createReaction(reaction: CreateReactionDTO): Promise<ReactionQuestion> {
    const question = await this.questionRepository.findOneOrFail({
      where: {
        id: Equal(reaction.questionId),
      },
    });

    const newReaction = new ReactionQuestion({
      id: reaction.id,
      userId: reaction.userId,
      question: question,
      reaction: reaction.reaction,
    });

    return this.reactionRepository.save(newReaction);
  }

  async updateQuestion(id: string, questionDTO: Question, user: UserAuth) {
    const question = await this.questionRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    const { productId, ...others } = questionDTO;

    const newQuestion = {
      ...question,
      ...others,
    };
    await this.isUserQuestionOwner(newQuestion, user);
    await this.questionRepository.remove(question);

    return this.questionRepository.save(newQuestion);
  }

  async removeQuestion(id: string) {
    const question = await this.questionRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    const questionJSON = JSON.stringify(question);

    await this.questionRepository.remove(question);
    return JSON.parse(questionJSON);
  }

  async removeReaction(id: string, user: UserAuth) {
    const reaction = await this.reactionRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    await this.isUserReactionOwner(reaction, user);

    this.reactionRepository.remove(reaction);
    return {
      ...reaction,
    };
  }

  isUserQuestionOwner(question: Question, user: UserAuth) {
    if (scope(String(question.userId), String(user.id)) && user.role !== Role.Admin) {
      throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
  }

  isUserReactionOwner(reaction: ReactionQuestion, user: UserAuth) {
    if (scope(String(reaction.userId), String(user.id)) && user.role !== Role.Admin) {
      throw new CustomExternalError([ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
  }

  async mergeQuestions(queryBuilder: SelectQueryBuilder<Question>) {
    const questions = await queryBuilder.getMany();
    const result = questions.map(async question => await this.mergeQuestionUserId(question));

    return Promise.all(result);
  }

  async mergeQuestionUserId(question: Question): Promise<QuestionDTO> {
    const user = await this.getUserById(question.userId);

    const userInDB = {
      id: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
    };

    return {
      id: question.id,
      text: question.text,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      product: (await this.getProductById(question.productId)) ?? question.productId,
      user: userInDB,
      comments: question.comments,
      reactions: question.reactions,
    };
  }
}
