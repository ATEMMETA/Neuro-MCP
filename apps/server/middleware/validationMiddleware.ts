/**
 * validationMiddleware.ts
 *
 * Middleware for validating Express request bodies using Zod schemas.
 * Logs validation errors and ensures type-safe request bodies.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { Logger } from './AgentManager';

export const validateBody = (schema: AnyZodObject, logger: Logger) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        logger.warn(
          { reqId: req.id, errors, method: req.method, url: req.url },
          'Request body validation failed'
        );
        return res.status(400).json({
          success: false,
          error: 'Invalid request payload',
          details: errors,
        });
      }
      // Replace request body with validated data for type safety
      req.body = result.data;
      logger.info({ reqId: req.id, method: req.method, url: req.url }, 'Request body validated');
      next();
    } catch (error) {
      logger.error(
        { reqId: req.id, error, method: req.method, url: req.url },
        'Validation middleware error'
      );
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
};
