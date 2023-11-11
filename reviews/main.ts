import path from "path";
import "reflect-metadata";
import { bootstrap } from "../core/bootstrap";
import { ReviewApp } from "./review.app";
import reviewDataSource from './review.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), ReviewApp, controllerPaths, reviewDataSource);
