import * as jwt from 'jsonwebtoken';
export const oneTimeToken = (payload: object) => {
  const { REVIEW_ACCESS_SECRET_TOKEN } = process.env;
  return jwt.sign(payload, REVIEW_ACCESS_SECRET_TOKEN, { expiresIn: '1 day' });
};
