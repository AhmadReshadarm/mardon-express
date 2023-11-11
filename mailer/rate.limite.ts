import { rateLimit } from 'express-rate-limit';
const sendAdminEmailToCallLimiter: any = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: 'Too many request from this IP, please try again after 24 hour',
});

export { sendAdminEmailToCallLimiter };
