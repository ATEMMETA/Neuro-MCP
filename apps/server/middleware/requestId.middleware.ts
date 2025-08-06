# Adds unique request IDs for tracing #Logging
// apps/server/src/middleware/requestId.middleware.ts
import pino from 'pino';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Configure Pino logger
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { pid: process.pid },
});

// Middleware to attach a unique request ID
export function attachRequestId(req: Request, res: Response, next: NextFunction) {
  (req as any).id = randomUUID();
  res.setHeader('X-Request-Id', (req as any).id);
  next();
}
import { logger } from '../utils/logger';

export function attachRequestId(req, _res, next) {
  // Assuming you generate or retrieve a requestId here
  const requestId = req.headers['x-request-id'] || generateUniqueRequestId();

  // Attach request ID to req for later use
  req.id = requestId;

  // Log a message with requestId context
  logger.info({ reqId: requestId }, 'Received new request');

  next();
}
