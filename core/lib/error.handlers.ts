import { NextFunction, Request, Response } from 'express';
import { CustomExternalError } from '../domain/error/custom.external.error';
import { CustomInternalError } from '../domain/error/custom.internal.error';
import { ErrorCode } from '../domain/error/error.code';
import { HttpStatus } from './http-status';
import { logger } from './logger';
import { EntityNotFoundError } from 'typeorm';

export const errorHandler = (error: any, request: Request, response: Response, next: NextFunction): void => {
  if (error instanceof CustomExternalError || error.type === "entity.parse.failed") {
    response.status(error.statusCode).json({ message: error.messages?? error.message });
  } else if (error instanceof SyntaxError) {
    response.status(HttpStatus.BAD_REQUEST).json({ message: error.message })
  } else if (error.sqlMessage) {
    response.status(HttpStatus.CONFLICT).json({ message: error.sqlMessage });
  } else if (error.name && error.name === 'AxiosError') {
    response.status(error.response.status).json(error.response.data)
  } else if (error instanceof EntityNotFoundError) {
    response.status(HttpStatus.NOT_FOUND).json({ message: error.message });
  } else if (error) {
    logger.error(ErrorCode.INTERNAL_ERROR, {
      errorMessage: error.message,
      stack: error instanceof CustomInternalError ? error.stackArray : error.stack,
    });
    console.error(error);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ErrorCode.INTERNAL_ERROR });
  }
  else {
    next();
  }
};

type AsyncFunc = (req: Request, resp: Response, next: NextFunction) => Promise<void>;

export const asyncHandler: (func: AsyncFunc) => AsyncFunc =
  func =>
  (request, response, next): Promise<void> =>
    Promise.resolve(func(request, response, next)).catch((error: Error) =>
      errorHandler(error, request, response, next),
    );
