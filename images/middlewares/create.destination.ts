import fs from 'fs';
import { DESTINATION } from '../config';
import { NextFunction, Request, Response } from 'express';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { HttpStatus } from '../../core/lib/http-status';

export async function createDestination(req: Request, resp: Response, next: NextFunction) {
  if (!fs.existsSync(DESTINATION)) {
    try {
      await fs.promises.mkdir(DESTINATION);
      next();
    } catch (e: any) {
      if (e.errno !== -17) {
        throw new CustomExternalError([ErrorCode.INTERNAL_ERROR], HttpStatus.INTERNAL_SERVER_ERROR);
      }
      next();
    }
  }
  next();
}
