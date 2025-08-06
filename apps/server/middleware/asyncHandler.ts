/**
 * asyncHandler.ts
 *
 * Async handler middleware for Express routes with tracing support.
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../services/AgentManager';
import { trace } from '@opentelemetry/api';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  logger: Logger
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const tracer = trace.getTracer('my-tmux-project');
    return tracer.startActiveSpan(`handle:${req.method}:${req.path}`, (span) => {
      span.setAttribute('http.method', req.method);
      span.setAttribute('http.url', req.url);
      span.setAttribute('request.id', req.id);
      Promise.resolve(fn(req, res, next))
        .catch((error) => {
          logger.error(
            { reqId: req.id, error, url: req.url, method: req.method },
            'Request handler error'
          );
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message });
          next(error);
        })
        .finally(() => span.end());
    });
  };
};
