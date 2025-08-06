# Centralized error handling #ErrorManagement
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Centralized Express error handler middleware.
 * Logs error and sends standardized JSON response.
 */
export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const reqId = (req as any).id || 'unknown';

  // Log error with context
  logger.error({ reqId, err, stack: err.stack }, 'Unhandled error occurred');

  // Customize response (could check for validation or known error types)
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    reqId,
  });
}
