/**
 * compose.ts
 *
 * Composes multiple Express middleware functions into a single middleware.
 * Executes middleware in sequence, handling errors with logging.
 * Usage: app.use(compose([mw1, mw2, mw3], logger))
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Logger } from './AgentManager';

export function compose(middlewares: RequestHandler[], logger: Logger): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    let index = -1;

    function dispatch(i: number): void {
      if (i <= index) {
        const error = new Error('next() called multiple times');
        logger.error({ reqId: req.id, error, middlewareIndex: i }, 'Middleware composition error');
        return next(error);
      }
      index = i;
      const fn = middlewares[i];
      if (!fn) return next();
      try {
        fn(req, res, (err?: any) => {
          if (err) {
            logger.error(
              { reqId: req.id, error: err.message, middlewareIndex: i },
              'Middleware execution failed'
            );
            return next(err);
          }
          dispatch(i + 1);
        });
      } catch (err) {
        logger.error(
          { reqId: req.id, error: err.message, middlewareIndex: i },
          'Middleware execution error'
        );
        next(err);
      }
    }

    dispatch(0);
  };
}
