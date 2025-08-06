// apps/server/middleware/compose.ts

import { RequestHandler } from 'express';
import helmet from 'helmet';
app.use(helmet());
import { validateBody } from './middleware/validationMiddleware';
import { agentConfigSchema } from './validation/agentSchema';

router.post('/create', validateBody(agentConfigSchema), async (req, res) => {
  // validated at this point
});
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Usage:
app.post('/agents/:name/run', asyncHandler(async (req, res) => {
  const result = await agentManager.runAgent(req.params.name, req.body);
  res.json({ success: true, result });
}));


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
