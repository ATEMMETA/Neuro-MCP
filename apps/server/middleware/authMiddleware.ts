# Authentication for securing endpoints #Security
import { Request, Response, NextFunction } from 'express';
import { logger } from './requestId.middleware';
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


const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  logger.error('API_KEY environment variable is not set. Exiting.');
  process.exit(1);
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.header('x-api-key');

  if (!apiKey || apiKey !== API_KEY) {
    logger.warn({
      reqId: (req as any).id,
      url: req.url,
      method: req.method,
      ip: req.ip,
    }, 'Unauthorized access attempt');

    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key' });
  }

  next();
}
