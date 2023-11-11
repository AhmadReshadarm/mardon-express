import path from "path";
import "reflect-metadata";
import { bootstrap } from "../core/bootstrap";
import { BannerApp } from "./banner.app";
import bannerDataSource from './banner.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), BannerApp, controllerPaths, bannerDataSource);
