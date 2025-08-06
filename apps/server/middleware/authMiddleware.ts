/**
 * authMiddleware.ts
 * 
 * Middleware for securing Express endpoints with API key or JWT authentication,
 * request body validation, error handling, rate limiting, and OpenTelemetry tracing.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { trace } from '@opentelemetry/api';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

// Logger interface consistent with AgentManager/logging expectations
export interface Logger {
  info: (meta: any, message: string) => void;
  warn: (meta: any, message: string) => void;
  error: (meta: any, message: string) => void;
}

// Declare extension of Request interface for id property
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Middleware factory for authentication with API Key or JWT.
 * 
 * @param logger - Logger instance for structured logging
 * @param apiKeys - Set of valid API keys
 * @param jwtSecret - JWT secret key for token verification
 */
export function authenticate(
  logger: Logger,
  apiKeys: Set<string>,
  jwtSecret: string
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const tracer = trace.getTracer('my-tmux-project');
    return tracer.startActiveSpan('authenticate', (span) => {
      span.setAttribute('http.method', req.method);
      span.setAttribute('http.url', req.url);

      const apiKey = req.header('x-api-key');
      const authHeader = req.header('authorization');

      // Check API key authentication
      if (apiKey && apiKeys.has(apiKey)) {
        logger.info({ reqId: req.id, url: req.url, method: req.method }, 'Authenticated via API key');
        span.setAttribute('auth.method', 'api-key');
        span.end();
        return next();
      }

      // Check JWT authentication
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          jwt.verify(token, jwtSecret);
          logger.info({ reqId: req.id, url: req.url, method: req.method }, 'Authenticated via JWT');
          span.setAttribute('auth.method', 'jwt');
          span.end();
          return next();
        } catch (error: any) {
          logger.warn(
            { reqId: req.id, url: req.url, method: req.method, ip: req.ip, error },
            'Invalid JWT'
          );
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message });
          span.end();
          return res.status(401).json({ success: false, error: 'Unauthorized: Invalid JWT' });
        }
      }

      // Unauthorized request if no valid auth given
      logger.warn(
        { reqId: req.id, url: req.url, method: req.method, ip: req.ip },
        'Unauthorized access attempt'
      );
      span.setStatus({ code: 2, message: 'Unauthorized' });
      span.end();
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key or JWT' });
    });
  };
}

/**
 * Validation middleware generator using Zod schema.
 * Validates request body asynchronously.
 * 
 * @param schema - Zod schema object
 * @param logger - Logger for error reporting
 */
export function validateBody(schema: z.ZodSchema, logger: Logger): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = await schema.parseAsync(req.body);
      req.body = validatedBody; // Replace with parsed (typed) data
      next();
    } catch (error: any) {
      logger.error({ reqId: req.id, error }, 'Request body validation failed');
      res.status(400).json({ success: false, error: 'Invalid request body', details: error.errors || error.message });
    }
  };
}

/**
 * Async handler wrapper to catch errors from async route handlers.
 * 
 * @param fn - Async function to wrap
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Fallback logger or improve by injecting logger instance as needed
      console.error(`Unhandled error: ${error.message}`, { reqId: req.id, url: req.url, method: req.method });
      res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
      next(error);
    });
  };
};

/**
 * Rate limiter middleware for API key endpoints or any protected routes.
 * Customize as needed or instantiate separately.
 */
export function createApiRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { success: false, error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
