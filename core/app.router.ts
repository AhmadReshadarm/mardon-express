import { Router } from 'express';

export abstract class AppRouter {
    protected static instance: Router = Router();

    static get router(): Router {
        return AppRouter.instance;
    }
}
