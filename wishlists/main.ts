import path from "path";
import "reflect-metadata";
import { bootstrap } from "../core/bootstrap";
import { WishlistApp } from "./wishlist.app";
import wishlistDataSource from './wishlist.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), WishlistApp, controllerPaths,  wishlistDataSource);
