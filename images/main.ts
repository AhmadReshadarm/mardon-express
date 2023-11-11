import path from "path";
import "reflect-metadata";
import { bootstrap } from "../core/bootstrap";
import { ImageApp } from "./image.app";
import imageDataSource from './image.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), ImageApp, controllerPaths, imageDataSource);
