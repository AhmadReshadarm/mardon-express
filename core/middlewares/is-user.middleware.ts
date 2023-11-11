import { HttpStatus } from '../lib/http-status';
import { Role } from '../enums/roles.enum';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getToken } from '../lib/get-token';

export function isUser(req: Request, res: Response, next: NextFunction): void {
  const token = getToken(req);
  const { ACCESS_SECRET_TOKEN } = process.env;
  const tokenInfo = jwt.verify(token!, ACCESS_SECRET_TOKEN ?? '') as any;

  if (tokenInfo?.role !== Role.User && tokenInfo?.role !== Role.Admin) {
    res.status(HttpStatus.FORBIDDEN).json({ message: 'You are forbidden to retrieve this data' });

    return;
  }

  res.locals.user = tokenInfo;

  next();
}
