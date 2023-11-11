import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import { HttpStatus } from '../../core/lib/http-status';
import { CommentService } from './comment.service';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { isAdmin, isUser, verifyToken } from '../../core/middlewares';
import { QuestionReactionComment } from '../../core/entities';
import { validation } from '../../core/lib/validator';

@singleton()
@Controller('/question-comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get()
  async getComments(req: Request, resp: Response) {
    try {
      const comments = await this.commentService.getComments(req.query);
      resp.json(comments);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get(':id')
  async getComment(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const comment = await this.commentService.getComment(id);

      resp.json(comment);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Post()
  @Middleware([verifyToken, isAdmin])
  async createComment(req: Request, resp: Response) {
    req.body.userId = resp.locals.user.id;
    try {
      const created = await this.commentService.createComment(req.body);

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
      const reaction = new QuestionReactionComment(req.body);
      reaction.id = await this.commentService.getNewReactionId();
      await validation(reaction);

      const created = await this.commentService.createReaction(reaction);

      resp.status(HttpStatus.CREATED).json(created);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Put(':id')
  @Middleware([verifyToken, isAdmin])
  async updateComment(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const updated = await this.commentService.updateComment(
        id,
        req.body,
        resp.locals.user,
        req.headers.authorization!,
      );

      resp.status(HttpStatus.OK).json(updated);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete(':id')
  @Middleware([verifyToken, isAdmin])
  async removeComment(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const removed = await this.commentService.removeComment(id, resp.locals.user);

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
      const removed = await this.commentService.removeReaction(id, resp.locals.user);

      console.log(removed);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
