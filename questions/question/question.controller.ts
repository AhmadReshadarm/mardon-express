import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { Question } from '../../core/entities';
import { HttpStatus } from '../../core/lib/http-status';
import { validation } from '../../core/lib/validator';
import { QuestionService } from './question.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, isUser, verifyToken } from '../../core/middlewares';
import { CreateReactionDTO } from '../questions.dtos';

@singleton()
@Controller('/questions')
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  @Get()
  async getQuestions(req: Request, resp: Response) {
    try {
      const questions = await this.questionService.getQuestions(req.query);
      resp.json(questions);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get(':id')
  @Middleware([verifyToken, isUser])
  async getQuestion(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const question = await this.questionService.getQuestion(id);

      resp.json(question);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post()
  @Middleware([verifyToken, isUser])
  async createQuestion(req: Request, resp: Response) {
    try {
      const newQuestion = new Question(req.body);
      newQuestion.userId = resp.locals.user.id;

      await validation(newQuestion);
      const created = await this.questionService.createQuestion(newQuestion);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post('reaction')
  @Middleware([verifyToken, isUser])
  async createReaction(req: Request, resp: Response) {
    req.body.userId = resp.locals.user.id;

    try {
      const reaction: CreateReactionDTO = req.body;
      reaction.id = await this.questionService.getNewReactionId();
      await validation(reaction);

      const created = await this.questionService.createReaction(reaction);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateReview(req: Request, resp: Response) {
    const { id } = req.params;

    try {
      const updated = await this.questionService.updateQuestion(id, req.body, resp.locals.user);

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isUser])
  async removeQuestion(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const removed = await this.questionService.removeQuestion(id);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete('reaction/:id')
  @Middleware([verifyToken, isUser])
  async removeReaction(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const removed = await this.questionService.removeReaction(id, resp.locals.user);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
