import nodemailer from 'nodemailer';
import { signupEmailTemplate, resetPswEmailTemplate } from './email.template';

const baseURL = 'https://ivill.ru';
const sendMail = (token: any, user: any) => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.beget.com',
    port: 465,
    secure: true,
    auth: {
      user: 'info@ivill.ru',
      pass: process.env.EMAIL_SERVICE_SECRET_KEY,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });
  const url = `${baseURL}/profile/verify/${token}`;
  transporter.sendMail(
    {
      to: user.email,
      from: 'info@ivill.ru',
      subject: `Подтверждать ${user.email}`,
      html: signupEmailTemplate(user.firstName, user.email, url),
    },
    (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
    },
  );
};

const sendMailResetPsw = (token: any, user: any) => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.beget.com',
    port: 465,
    secure: true,
    auth: {
      user: 'info@ivill.ru',
      pass: process.env.EMAIL_SERVICE_SECRET_KEY,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });
  const url = `${baseURL}/profile/pswreset/confirmpsw/${token}`;
  transporter.sendMail(
    {
      to: user.email,
      from: 'info@ivill.ru',
      subject: `Сбросить пароль для ${user.email}`,
      html: resetPswEmailTemplate(user.firstName, user.email, url),
    },
    (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
    },
  );
};

const sendHelpDiskMail = (userEmail: string, adminEmail: string, text: string) => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.beget.com',
    port: 465,
    secure: true,
    auth: {
      user: 'info@ivill.ru',
      pass: process.env.EMAIL_SERVICE_SECRET_KEY,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });

  transporter.sendMail(
    {
      to: adminEmail,
      from: 'info@ivill.ru',
      subject: `Вопрос от ${userEmail}`,
      html: `<div><p>Вопрос от <a href="mailto:${userEmail}">${userEmail}</a>:</p></div><div><p>${text}</p></div>`,
    },
    (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
    },
  );
};

export { sendMail, sendMailResetPsw, sendHelpDiskMail };
