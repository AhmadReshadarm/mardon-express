import path from "path";
import "reflect-metadata";
import { bootstrap } from "../core/bootstrap";
import { OrderApp } from "./order.app";
import orderDataSource from './order.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), OrderApp, controllerPaths, orderDataSource);
