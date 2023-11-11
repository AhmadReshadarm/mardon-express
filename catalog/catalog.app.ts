import { singleton } from "tsyringe";
import { App } from "../core/app";

@singleton()
export class CatalogApp extends App {}
