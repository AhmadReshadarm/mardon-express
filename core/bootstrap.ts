import * as dotenv from 'dotenv';
import 'reflect-metadata';
import { Container } from './container';
import { DataSource } from 'typeorm';

dotenv.config();

function handleExit(error: Error | undefined, container: Container): void {
  container
    .destroy()
    .then(() => {
      if (error) {
        console.error('fatal error 🔥', error);
      } else {
        console.log('terminating ⛔️');
      }
      setTimeout(() => process.exit(error ? 1 : 0), 0);
    })
    .catch((errorOnClose: string) => {
      console.error('error on close 💀', errorOnClose);
      setTimeout(() => process.exit(1), 0);
    });
}

export async function bootstrap(
  port: number,
  appClass: any,
  controllerPaths: string,
  dataSource?: DataSource,
): Promise<void> {
  const container = new Container(controllerPaths);
  const app = await container.create(appClass, dataSource);

  const server = app.appServer
    .listen(port, () => {
      console.log(`listening on port ${port} 🚀`);
    })
    .on('error', (error: any) => handleExit(error, container));

  const shutdownHandler = () => {
    app.close();
    server.close((error: any) => handleExit(error, container));
  };

  process.once('SIGINT', shutdownHandler);
  process.once('SIGTERM', shutdownHandler);
}
