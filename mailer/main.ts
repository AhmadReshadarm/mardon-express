import path from "path";
import "reflect-metadata";
import { bootstrap } from "../core/bootstrap";
import { MailerApp } from "./mailer.app";
import mailerDataSource from './mailer.data-source';

const controllerPaths = path.resolve(__dirname, './load-controllers.js');
const { PORT } = process.env;

bootstrap(Number(PORT ?? 8080), MailerApp, controllerPaths, mailerDataSource);
