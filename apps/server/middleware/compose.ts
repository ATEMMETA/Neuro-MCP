// apps/server/middleware/compose.ts

import { RequestHandler } from 'express';

/**
 * Composes multiple middleware functions into one middleware.
 * Usage: app.use(compose([mw1, mw2, mw3]))
 */
export function compose(middlewares: RequestHandler[]): RequestHandler {
  return (req, res, next) => {
    let index = -1;

    function dispatch(i: number): void {
      if (i <= index) return next(new Error('next() called multiple times'));
      index = i;
      let fn = middlewares[i];
      if (!fn) return next();
      try {
        fn(req, res, (err?: any) => {
          if (err) return next(err);
          dispatch(i + 1);
        });
      } catch (err) {
        next(err);
      }
    }

    dispatch(0);
  };
}
