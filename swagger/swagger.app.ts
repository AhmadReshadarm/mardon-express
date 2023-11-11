import { injectable } from "tsyringe";
import { App } from "../core/app";
import swaggerUi from 'swagger-ui-express';

@injectable()
export class SwaggerApp extends App {
  constructor() {
    super();

    (async () => {
      const swaggerDocument = await import('./swagger.json');

      this.appServer.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    })()
  }
}
