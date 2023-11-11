import { container } from 'tsyringe';
import type { constructor } from 'tsyringe/dist/typings/types';
import { DataSource } from 'typeorm';
import { App } from './app';
import { AbstractController } from './abstract-controller';
import { logger } from './lib/logger';

export class Container {
  controllerPaths: string;
  constructor(controllerPaths: string) {
    this.controllerPaths = controllerPaths;
  }
    
  async create(appClass: any, dataSource?: DataSource): Promise<App> {
    await this.initDatabase(dataSource);

    const path = this.controllerPaths;
    const { default: loadControllers } = await import(path);

    await this.initController(loadControllers());
  
    return container.resolve(appClass);
  }

  async destroy(): Promise<void> {
    await Promise.all([
      this.closeDatabase(),
    ]);
  }

  private initController(controllers: ArrayLike<constructor<AbstractController>>) {
    Array.from<constructor<AbstractController>>(controllers).map(cls =>  container.registerType(typeof AbstractController, cls));
  }

  private async initDatabase(dataSource?: DataSource) {
    if (!dataSource) {
      return;
    }
    try {
      await dataSource.initialize();
      container.registerInstance(DataSource, dataSource);
      logger.info('Data Source has been initialized!');

    } catch (error) {
      console.error("Error during Data Source initialization:", error);
    }
  }

  private async closeDatabase() {
    await container.resolve(DataSource).destroy();
    logger.info('database connection is closed');
  }
}
