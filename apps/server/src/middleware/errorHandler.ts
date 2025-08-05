import { Request, Response, NextFunction } from 'express';
import { logger } from './requestId.middleware';

export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error({ err, reqId: req.id, url: req.url }, 'Unhandled error');
  res.status(500).json({ success: false, error: err.message });
}
