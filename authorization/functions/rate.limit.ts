import { rateLimit } from 'express-rate-limit';

const resetPasswordLimiter: any = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: 'Too many request from this IP, please try again after 24 hour',
});

const emailConfirmationLimiter: any = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: 'Too many request from this IP, please try again after 24 hour',
});

const changePasswordLimiter: any = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: 'Too many request from this IP, please try again after 24 hour',
});

const sendTokenLimiter: any = rateLimit({
  windowMs: 30 * 1000,
  max: 1,
  message: 'Too many request from this IP, please try again after 30s',
});
export { resetPasswordLimiter, changePasswordLimiter, sendTokenLimiter, emailConfirmationLimiter };
