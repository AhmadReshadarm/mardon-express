import * as jwt from 'jsonwebtoken';
export const emailToken = (payload: object) => {
  const { EMAIL_SECRET_TOKEN } = process.env;
  return jwt.sign(payload, EMAIL_SECRET_TOKEN, { expiresIn: '1 day' });
};
