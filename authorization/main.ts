import path from 'path';
import 'reflect-metadata';
import { bootstrap } from '../core/bootstrap';
import { AuthApp } from './auth.app';
import authDataSource from './auth.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), AuthApp, controllerPaths, authDataSource);
