# Centralized error handling #ErrorManagement
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import helmet from 'helmet';
app.use(helmet());
import { validateBody } from './middleware/validationMiddleware';
import { agentConfigSchema } from './validation/agentSchema';

router.post('/create', validateBody(agentConfigSchema), async (req, res) => {
  // validated at this point
});
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Usage:
app.post('/agents/:name/run', asyncHandler(async (req, res) => {
  const result = await agentManager.runAgent(req.params.name, req.body);
  res.json({ success: true, result });
}));



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
