import { json, urlencoded } from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { singleton } from 'tsyringe';
import { logger } from './lib/logger';

@singleton()
export class App {
  static readonly server = express();

  get appServer() {
    return App.server;
  }

  private isKeepAliveDisabled = false;

  constructor() {
    const server = this.appServer;
    const env = server.get('env');

    logger.info(`environment: ${env}`);
    server.use(helmet());
    server.use(
      env === 'production'
        ? morgan('combined', {
            stream: {
              write(message: string): void {
                logger.info(message);
              },
            },
          })
        : morgan('dev'),
    );
    server.use(cors({ exposedHeaders: ['Content-Disposition'] }));
    server.use(json());
    server.use(urlencoded({ extended: false }));
    server.use(compression());
    server.use((request, response, next): void => {
      if (this.isKeepAliveDisabled) {
        response.set('Connection', 'close');
      }
      next();
    });
    server.set('trust proxy', 1);
  }

  close(): void {
    this.isKeepAliveDisabled = true;
  }
}
