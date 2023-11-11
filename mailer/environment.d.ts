declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EMAIL_SECRET_TOKEN: string;
      ACCESS_SECRET_TOKEN: string;
      REFRESH_SECRET_TOKEN: string;
      MYSQL_HOST: string;
      MYSQL_ROOT_PASSWORD: string;
      MYSQL_DATABASE: string;

      MAIL_HOST: string;
      MAIL_PORT: string;
      MAIL_USER: string;
      MAIL_PASSWORD: string;
      MAIL_FROM: string;
    }
  }
}

export {};
