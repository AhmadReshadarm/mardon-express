import path from "path";
import "reflect-metadata";
import { bootstrap } from "../core/bootstrap";
import { SwaggerApp } from "./swagger.app";

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), SwaggerApp, controllerPaths);
