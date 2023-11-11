import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../lib/http-status';
import { scope } from './access.user';
import { Role } from '../enums/roles.enum';

export async function verifyUserId(req: Request, resp: Response, next: NextFunction) {
  const { id } = req.params;
  const { jwt } = resp.locals;
  if (!id || id == undefined) {
    resp.status(HttpStatus.NOT_FOUND).json({ message: 'No user id found in params' });
  }
  if (scope(String(jwt.id), id) && jwt.role !== Role.Admin) {
    resp.status(HttpStatus.FORBIDDEN).json({ message: 'You are forbidden to access this data' });
    return;
  }

  next();
}
