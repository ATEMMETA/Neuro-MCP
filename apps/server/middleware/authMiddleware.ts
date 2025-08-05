# Authentication for securing endpoints #Security
// apps/server/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from './requestId.middleware';

const API_KEY = process.env.API_KEY || 'insecure-dev-key';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.get('x-api-key');

  if (!apiKey || apiKey !== API_KEY) {
    logger.warn({ reqId: req.id, url: req.url, method: req.method }, 'Unauthorized access attempt');
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key' });
  }

  next();
}
