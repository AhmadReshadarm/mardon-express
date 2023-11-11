import { Router } from "express";

export abstract class AbstractController {
  static readonly routes: Router;
}
