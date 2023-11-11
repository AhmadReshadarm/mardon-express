import path from 'path';
import 'reflect-metadata';
import { bootstrap } from '../core/bootstrap';
import { QuestionApp } from './question.app';
import questionDataSource from './question.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), QuestionApp, controllerPaths, questionDataSource);
