import pino from 'pino';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: { pid: process.pid },
});

export function attachRequestId(req: Request, res: Response, next: NextFunction) {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  logger.info({
    reqId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  }, 'Request started');
  next();
}
import { randomUUID } from 'crypto';
import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

export function attachRequestId(req: any, res: any, next: any) {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}
