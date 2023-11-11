import { getToken } from '../lib/get-token';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { HttpStatus } from '../lib/http-status';

export async function verifyToken(req: Request, resp: Response, next: NextFunction) {
  const token = getToken(req);
  const { ACCESS_SECRET_TOKEN } = process.env;

  if (!token) {
    resp.status(HttpStatus.UNAUTHORIZED).json({ message: 'Unauthorized: No token found' });

    return;
  }

  jwt.verify(token, ACCESS_SECRET_TOKEN ?? '', (error, user) => {
    if (error) {
      return resp.status(HttpStatus.FORBIDDEN).json({ message: `Access has been expired: ${error}` });
    }

    resp.locals.jwt = user;

    next();
  });
}
