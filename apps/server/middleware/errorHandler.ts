/**
 * errorHandler.ts
 *
 * Centralized Express error handler middleware.
 * Logs errors with request context and sends standardized JSON responses.
 * Categorizes errors for appropriate status codes and messages.
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from './AgentManager';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode?: number;
  isValidationError?: boolean;
  details?: any;
  code?: string; // for JWT or other error codes
}

export function errorHandler(logger: Logger) {
  return (err: AppError, req: Request, res: Response, _next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details: any = undefined;

    const reqId = req.id || `unknown-${Math.random().toString(36).slice(2)}`;

    // Detect Zod validation error
    if (err instanceof ZodError) {
      statusCode = 400;
      message = 'Validation error';
      details = err.errors;
      err.isValidationError = true;
    }
    // JWT error handling based on code or name
    else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'JWT token expired';
    } else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid JWT token';
    }
    // Use provided statusCode and message if defined
    else if (typeof err.statusCode === 'number') {
      statusCode = err.statusCode;
      message = err.message || message;
      details = err.details;
    }
    // Validation error flag detected
    else if (err.isValidationError) {
      statusCode = 400;
      message = err.message || 'Validation error';
      details = err.details;
    } else {
      // For generic errors, just use message or fallback
      message = err.message || message;
    }

    // Log full error object with stack trace in development only
    logger.error(
      {
        reqId,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        method: req.method,
        url: req.url,
        statusCode,
        details,
      },
      'Unhandled error occurred'
    );

    // Send JSON response with safe details
    res.status(statusCode).json({
      success: false,
      error: message,
      reqId,
      details: process.env.NODE_ENV === 'development' ? details ?? err.message : undefined,
    });

    // No call to next() since this is terminal middleware
  };
}
