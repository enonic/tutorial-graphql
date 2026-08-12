/**
 * Type definitions for the parts of lib-router used by this application.
 * See https://market.enonic.com/vendors/enonic/router-lib
 */
declare global {
    interface XpLibraries {
        '/lib/router': typeof import('./router');
    }
}

import type {Request, Response} from '@enonic-types/core';

export type RouteHandler = (req: Request) => Response;

export interface Router {
    get(pattern: string, handler: RouteHandler): void;
    post(pattern: string, handler: RouteHandler): void;
    put(pattern: string, handler: RouteHandler): void;
    delete(pattern: string, handler: RouteHandler): void;
    all(pattern: string, handler: RouteHandler): void;
    dispatch(req: Request): Response;
}

declare function newRouter(): Router;

export default newRouter;
