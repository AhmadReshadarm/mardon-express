import path from "path";
import "reflect-metadata";

import { bootstrap } from "../core/bootstrap";
import { CatalogApp } from "./catalog.app";
import catalogDataSource from './catalog.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), CatalogApp, controllerPaths, catalogDataSource);
