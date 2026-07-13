// export interface User {
//   email: string;
//   password: string;
//   confirmationURL?: string;
// }
// export interface Payload {
//   email: string;
//   userName: string;
//   confirmationURL?: string;
//   token?: string;
// }

// const signupEmailTemplate = (user: User) => `
//     <div>
//       <h1>Добро пожаловать в <a href="https://nbhoz.ru">nbhoz.ru</a></h1>
//       <div><span>Ваш логин: ${user.email}</span></div>
//       <div><span>Ваш пароль: ${user.password}</span></div>
//        <br />
//       <a target="_blank" href="${user.confirmationURL}">Нажмите здесь для подтверждения ${user.email}</a>
//     </div>
// `;

// const tokenEmailTemplate = (payload: Payload) => `
//     <div>
//       <h1><b>${payload.userName}</b> добро пожаловать в NBHOZ</h1>
//        <br />
//       <span>
//         Пожалуйста, нажмите на ссылку ниже, чтобы подтвердить ваш адрес
//         электронной почты на <a href="https://nbhoz.ru">nbhoz.ru</a>
//       </span>
//        <br />
//       <a target="_blank" href="${payload.confirmationURL}">Нажмите здесь для подтверждения ${payload.email}</a>
//     </div>
// `;

// const resetPswEmailTemplate = (userName: string, email: string, confirmationUrl: string) => `
//     <div>
//       <h1>Здравствуйте <b>${userName}</b></h1>
//        <br />
//       <span >
//        Для сброса пароля нажмите на ссылку ниже, она перенаправит вас на страницу сброса пароля на нашем сайте <a href="https://nbhoz.ru">nbhoz.ru</a>
//       </span>
//        <br />
//       <a target="_blank" href="${confirmationUrl}">Нажмите здесь, чтобы сбросить пароль для ${email}</a>
//       <br />
//       <span style="color:red;">Если вы не запрашивали такое действие, игнорируйте это сообщение</span>
//     </div>
// `;

export interface User {
  email: string;
  password: string;
  confirmationURL?: string;
}
export interface Payload {
  email: string;
  userName: string;
  confirmationURL?: string;
  token?: string;
}

const signupEmailTemplate = (user: User) => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Добро пожаловать в NBHOZ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eee8dc">
    <tr>
      <td align="center" style="padding: 30px 0;">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-collapse: collapse; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr style="background-color:#eee8dc; height:100px;">
            <td align="center" style="padding: 20px; border-bottom: 1px solid #eeeeee;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-size: 24px; font-weight: bold; color: #000000;">NBHOZ</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px 25px;">
              <h2 style="margin: 0 0 15px; font-size: 22px; color: #000000;">Добро пожаловать в <a href="https://nbhoz.ru" style="color: #000000; text-decoration: underline;">nbhoz.ru</a></h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                Ваш аккаунт успешно создан. Используйте указанные данные для входа:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
                <tr>
                  <td style="padding: 10px 0; font-size: 16px;">
                    <strong style="color: #7f8c8d;">Логин:</strong> ${user.email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 16px;">
                    <strong style="color: #7f8c8d;">Пароль:</strong> ${user.password}
                  </td>
                </tr>
              </table>
              <p style="margin: 25px 0 10px; font-size: 14px; color: #555555;">
                Для завершения регистрации подтвердите адрес электронной почты, нажав на кнопку ниже:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 15px 0 0;">
                    <a href="${user.confirmationURL}" target="_blank" style="display: inline-block; background-color: #333333; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">Подтвердить ${user.email}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #eee8dc; color: #000000;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 5px 0; font-size: 12px;">
                    Телефон поддержки: +7 925-486-54-44 | Email: info@nbhoz.ru
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 5px 0; font-size: 12px;">
                    © ${new Date().getFullYear()} NBHOZ. Все права защищены.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const tokenEmailTemplate = (payload: Payload) => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение email | NBHOZ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eee8dc">
    <tr>
      <td align="center" style="padding: 30px 0;">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-collapse: collapse; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr style="background-color:#eee8dc; height:100px;">
            <td align="center" style="padding: 20px; border-bottom: 1px solid #eeeeee;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-size: 24px; font-weight: bold; color: #000000;">NBHOZ</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px 25px;">
              <h2 style="margin: 0 0 15px; font-size: 22px; color: #000000;">${payload.userName}, добро пожаловать в NBHOZ</h2>
              <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.5; color: #333333;">
                Пожалуйста, подтвердите ваш адрес электронной почты, чтобы активировать учётную запись на <a href="https://nbhoz.ru" style="color: #000000; text-decoration: underline;">nbhoz.ru</a>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 15px 0 0;">
                    <a href="${payload.confirmationURL}" target="_blank" style="display: inline-block; background-color: #333333; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">Подтвердить ${payload.email}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #eee8dc; color: #000000;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 5px 0; font-size: 12px;">
                    Телефон поддержки: +7 925-486-54-44 | Email: info@nbhoz.ru
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 5px 0; font-size: 12px;">
                    © ${new Date().getFullYear()} NBHOZ. Все права защищены.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const resetPswEmailTemplate = (userName: string, email: string, confirmationUrl: string) => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сброс пароля | NBHOZ</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eee8dc">
    <tr>
      <td align="center" style="padding: 30px 0;">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-collapse: collapse; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr style="background-color:#eee8dc; height:100px;">
            <td align="center" style="padding: 20px; border-bottom: 1px solid #eeeeee;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-size: 24px; font-weight: bold; color: #000000;">NBHOZ</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px 25px;">
              <h2 style="margin: 0 0 15px; font-size: 22px; color: #000000;">Здравствуйте, ${userName}</h2>
              <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.5; color: #333333;">
                Для сброса пароля перейдите по ссылке ниже. Вы будете перенаправлены на страницу сброса пароля на сайте <a href="https://nbhoz.ru" style="color: #000000; text-decoration: underline;">nbhoz.ru</a>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 15px 0 0;">
                    <a href="${confirmationUrl}" target="_blank" style="display: inline-block; background-color: #333333; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">Сбросить пароль для ${email}</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 25px 0 0; font-size: 14px; color: #e74c3c; text-align:center">
                Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #eee8dc; color: #000000;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 5px 0; font-size: 12px;">
                    Телефон поддержки: +7 925-486-54-44 | Email: info@nbhoz.ru
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 5px 0; font-size: 12px;">
                    © ${new Date().getFullYear()} NBHOZ. Все права защищены.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export { signupEmailTemplate, resetPswEmailTemplate, tokenEmailTemplate };
