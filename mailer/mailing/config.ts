import SMTPTransport from 'nodemailer/lib/smtp-transport';

export const transportConfig: SMTPTransport.Options = {
  host: process.env.MAIL_HOST,
  port: +process.env.MAIL_PORT!,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
};

export const MAIL_FROM: string = process.env.MAIL_FROM!;
