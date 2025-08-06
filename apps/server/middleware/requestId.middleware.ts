/**
 * requestId.middleware.ts
 *
 * Middleware to attach a unique request ID to each incoming request,
 * expose it in response headers, and log request receipt.
 * Supports existing x-request-id headers from upstream proxies.
 */

import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { Logger } from './AgentManager';

export function attachRequestId(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitize incoming x-request-id header (allow only alphanumeric and hyphens)
    let requestId = (req.headers['x-request-id'] as string) || randomUUID();
    if (requestId && !/^[a-zA-Z0-9-]+$/.test(requestId)) {
      logger.warn(
        { invalidId: requestId, method: req.method, url: req.url },
        'Invalid x-request-id header, generating new ID'
      );
      requestId = randomUUID();
    }

    // Attach to request for downstream use
    req.id = requestId;

    // Expose ID in response headers for clients/tracing tools
    res.setHeader('X-Request-Id', requestId);

    // Log request start with ID
    logger.info({ reqId: requestId, method: req.method, url: req.url, ip: req.ip }, 'Received new request');

    next();
  };
}
