/**
 * errorHandler.ts
 *
 * Centralized Express error handler middleware.
 * Logs errors with request context and sends standardized JSON responses.
 * Categorizes errors for appropriate status codes and messages.
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from './AgentManager';

interface AppError extends Error {
  statusCode?: number;
  isValidationError?: boolean;
}

export function errorHandler(logger: Logger) {
  return (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const reqId = req.id || 'unknown';

    // Log error with context
    const logMetadata = {
      reqId,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      method: req.method,
      url: req.url,
    };
    logger.error(logMetadata, 'Unhandled error occurred');

    // Determine status code and message
    const statusCode = err.statusCode || (err.isValidationError ? 400 : 500);
    const message = err.isValidationError
      ? 'Validation error'
      : err.message || 'Internal Server Error';

    // Send standardized response
    res.status(statusCode).json({
      success: false,
      error: message,
      reqId,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  };
}
