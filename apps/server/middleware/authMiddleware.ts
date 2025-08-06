/**
 * authMiddleware.ts
 *
 * Middleware for authenticating Express requests with API key or JWT,
 * including role checks for admin-only endpoints.
 * Also includes request body validation, async error handling,
 * rate limiting, and OpenTelemetry tracing integration.
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
 * Enforces admin role for routes containing '/create'.
 *
 * @param logger - Logger instance for structured logging
 * @param apiKeys - Set of valid API keys
 * @param jwtSecret - JWT secret key for token verification
 * @returns Express middleware handler
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

      // API Key Authentication
      if (apiKey && apiKeys.has(apiKey)) {
        logger.info({ reqId: req.id, url: req.url, method: req.method }, 'Authenticated via API key');
        span.setAttribute('auth.method', 'api-key');
        span.end();
        return next();
      }

      // JWT Authentication with role enforcement
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const payload = jwt.verify(token, jwtSecret) as { user: string; roles: string[] };

          // Enforce admin role for sensitive routes
          if (!payload.roles?.includes('admin') && req.path.includes('/create')) {
            logger.warn({ reqId: req.id, url: req.url }, 'Forbidden: admin role required');
            span.setStatus({ code: 1, message: 'Forbidden: admin role required' });
            span.end();
            return res.status(403).json({ success: false, error: 'Forbidden: Admin role required' });
          }

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

      // Unauthorized if no valid auth provided
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
 * Validates request body asynchronously and logs errors.
 *
 * @param schema - Zod schema object
 * @param logger - Logger instance for error reporting
 * @returns Express middleware handler
 */
export function validateBody(schema: z.ZodSchema, logger: Logger): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = await schema.parseAsync(req.body);
      req.body = validatedBody; // Replace body with validated data
      next();
    } catch (error: any) {
      logger.error({ reqId: req.id, error }, 'Request body validation failed');
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors || error.message,
      });
    }
  };
}

/**
 * Async handler wrapper to catch errors from async route handlers.
 * Logs unhandled errors and responds with 500 status.
 *
 * @param fn - Async route handler function
 * @returns Express middleware handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Log error using console as fallback
      console.error(
        `Unhandled error: ${error?.message || error}`,
        { reqId: req.id, url: req.url, method: req.method }
      );
      res.status(500).json({ success: false, error: 'Internal server error', details: error?.message });
      next(error);
    });
  };
};

/**
 * Factory for rate limiter middleware to protect routes.
 *
 * Customize parameters as needed.
 *
 * @returns Express rateLimiter middleware
 */
export function createApiRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per IP per windowMs
    message: { success: false, error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
