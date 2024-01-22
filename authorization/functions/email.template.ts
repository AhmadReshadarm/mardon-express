export interface User {
  email: string;
  password: string;
}
export interface Payload {
  email: string;
  userName: string;
  confirmationURL?: string;
  token?: string;
}

const signupEmailTemplate = (user: User) => `
    <div>
      <h1>Добро пожаловать в <a href="https://nbhoz.ru">nbhoz.ru</a></h1>
      <div><span>Ваш логин: ${user.email}</span></div>
      <div><span>Ваш пароль: ${user.password}</span></div>
       <br />
    </div>
`;

const tokenEmailTemplate = (payload: Payload) => `
    <div>
      <h1><b>${payload.userName}</b> добро пожаловать в NBHOZ</h1>
       <br />
      <span>
        Пожалуйста, нажмите на ссылку ниже, чтобы подтвердить ваш адрес
        электронной почты на <a href="https://nbhoz.ru">nbhoz.ru</a>
      </span>
       <br />
      <a target="_blank" href="${payload.confirmationURL}">Нажмите здесь для подтверждения ${payload.email}</a>
    </div>
`;

const resetPswEmailTemplate = (userName: string, email: string, confirmationUrl: string) => `
    <div>
      <h1>Здравствуйте <b>${userName}</b></h1>
       <br />
      <span >
       Для сброса пароля нажмите на ссылку ниже, она перенаправит вас на страницу сброса пароля на нашем сайте <a href="https://nbhoz.ru">nbhoz.ru</a>
      </span>
       <br />
      <a target="_blank" href="${confirmationUrl}">Нажмите здесь, чтобы сбросить пароль для ${email}</a>
      <br />
      <span style="color:red;">Если вы не запрашивали такое действие, игнорируйте это сообщение</span>
    </div>
`;

export { signupEmailTemplate, resetPswEmailTemplate, tokenEmailTemplate };
