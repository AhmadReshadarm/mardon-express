const signupEmailTemplate = (userName: string, email: string, confirmationUrl: string) => `
    <div>
      <h1><b>${userName}</b> добро пожаловать в ivill</h1>
       <br />
      <span>
        Пожалуйста, нажмите на ссылку ниже, чтобы подтвердить свой адрес
        электронной почты на <a href="https://ivill.ru">ivill.ru</a>
      </span>
       <br />
      <a target="_blank" href="${confirmationUrl}">Нажмите здесь для подтверждения ${email}</a>
    </div>
`;

const resetPswEmailTemplate = (userName: string, email: string, confirmationUrl: string) => `
    <div>
      <h1>Здравствуйте <b>${userName}</b></h1>
       <br />
      <span >
       Для сброса пароля нажмите на ссылку ниже, она перенаправит вас на страницу сброса пароля на нашем сайте <a href="https://ivill.ru">ivill.ru</a>
      </span>
       <br />
      <a target="_blank" href="${confirmationUrl}">Нажмите здесь, чтобы сбросить пароль для ${email}</a>
      <br />
      <span style="color:red;">Если вы не запрашивали такое действие, игнорируйте это сообщение</span>
    </div>
`;

export { signupEmailTemplate, resetPswEmailTemplate };
