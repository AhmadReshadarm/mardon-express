import path from 'path';
import 'reflect-metadata';
import { bootstrap } from '../core/bootstrap';
import { NewsApp } from './news.app';
import bannerDataSource from './news.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), NewsApp, controllerPaths, bannerDataSource);
