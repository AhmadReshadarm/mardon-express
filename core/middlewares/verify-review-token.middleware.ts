import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { HttpStatus } from '../lib/http-status';

export async function verifyReviewToken(req: Request, resp: Response, next: NextFunction) {
  const token = req.query.token;
  const { REVIEW_ACCESS_SECRET_TOKEN } = process.env;

  if (!token) {
    resp.status(HttpStatus.UNAUTHORIZED).json({ message: 'Unauthorized: No token found' });

    return;
  }

  jwt.verify(JSON.stringify(token), REVIEW_ACCESS_SECRET_TOKEN ?? '', (error: any) => {
    if (error) {
      return resp.status(HttpStatus.FORBIDDEN).json({ message: `Access has been expired: ${error}` });
    }

    next();
  });
}
