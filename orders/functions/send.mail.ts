import nodemailer from 'nodemailer';

const sendInvoice = async (data: any, userEmail: any) => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.beget.com',
    port: 465,
    secure: true,
    auth: {
      user: 'checkout@fingarden',
      pass: process.env.CHECKOUT_MAIL_SECRET,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });

  transporter.sendMail(
    {
      to: userEmail,
      from: 'checkout@wuluxe.ru',
      subject: `Ваш заказ на fingarden: ${userEmail}`,
      html: data,
    },
    (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
    },
  );
};

export { sendInvoice };
