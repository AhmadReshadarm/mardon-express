import * as jwt from 'jsonwebtoken';

export const accessToken = (payload: object) => {
  const { ACCESS_SECRET_TOKEN } = process.env;
  return jwt.sign(payload, ACCESS_SECRET_TOKEN, { expiresIn: '2 hours' });
};
