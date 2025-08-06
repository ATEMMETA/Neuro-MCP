# Adds unique request IDs for tracing #Logging
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import helmet from 'helmet';
app.use(helmet());


/**
 * Middleware to attach a unique request ID to each incoming request,
 * exposes it in response headers, and logs request receipt.
 */
export function attachRequestId(req: Request, res: Response, next: NextFunction) {
  // Use existing request ID header if present (e.g., from upstream proxy)
  const requestId = req.headers['x-request-id'] as string || randomUUID();

  // Attach to request for downstream use
  (req as any).id = requestId;

  // Expose ID in response headers for clients/tracing tools
  res.setHeader('X-Request-Id', requestId);

  // Log request start with ID
  logger.info({ reqId: requestId, method: req.method, url: req.url }, 'Received new request');

  next();
}
