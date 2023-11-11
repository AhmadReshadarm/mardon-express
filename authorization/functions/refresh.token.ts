import * as jwt from 'jsonwebtoken';

export const refreshToken = (payload: object) => {
  const { REFRESH_SECRET_TOKEN } = process.env;
  return jwt.sign(payload, REFRESH_SECRET_TOKEN, { expiresIn: '1 day' });
};
