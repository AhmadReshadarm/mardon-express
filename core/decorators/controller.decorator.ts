import { HttpMethods, ControllerDecoratorParams } from "../enums";
import { container } from 'tsyringe';
import { AbstractController } from "core/abstract-controller";
import { errorHandler, asyncHandler } from "../lib/error.handlers";
import { App } from "../app";

export function Controller(path: string): Function {
    return function(target: typeof AbstractController): void {
        setTimeout(() => {
            for (const _action in target.prototype) {
                if (target.prototype.hasOwnProperty(_action)) {
                    const _path: string = Reflect.getMetadata(ControllerDecoratorParams.Path, target.prototype, _action) || '';
                    const method: HttpMethods = Reflect.getMetadata(ControllerDecoratorParams.Method, target.prototype, _action);
                    const middlewares: any[] = Reflect.getMetadata(ControllerDecoratorParams.Middleware, target.prototype, _action) || [];
                    const targetObject = container.resolve(target as any);
                    
                    App.server[method](`${path}/${_path}`, middlewares, asyncHandler((target.prototype as any)[_action].bind(targetObject)));
                }
            }

            App.server.use(errorHandler);
        });
    }
}
