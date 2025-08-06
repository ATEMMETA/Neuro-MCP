/**
 * app.ts
 *
 * Main Express application setup, integrating AgentManager, authentication,
 * request ID, and validation middleware.
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { AgentManager, AgentConfig, AgentTask, AgentResponse, Logger } from './AgentManager';
import { authenticate } from './authMiddleware';
import { validateBody } from './validationMiddleware';
import { attachRequestId } from './requestId.middleware';

// Extend Express Request interface for type-safe request ID
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// Mock logger (replace with actual implementation)
const logger: Logger = {
  info: (meta, msg) => console.log(`INFO: ${msg}`, meta),
  warn: (meta, msg) => console.warn(`WARN: ${msg}`, meta),
  error: (meta, msg) => console.error(`ERROR: ${msg}`, meta),
};

// Validation schema for AgentConfig
const agentConfigSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
  name: z.string().min(1, 'Agent name is required'),
  enabled: z.boolean(),
  description: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
});

// Async handler for consistent error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error(
        { reqId: req.id, error, url: req.url, method: req.method },
        'Request handler error'
      );
      res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
      next(error);
    });
  };
};

// Initialize API keys from environment
const API_KEYS = new Set(
  process.env.API_KEYS?.split(',').map((key) => key.trim()) || []
);
if (API_KEYS.size === 0) {
  logger.error({}, 'No API_KEYS environment variable set. Exiting.');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Apply global middleware
app.use(helmet()); // Secure HTTP headers
app.use(express.json()); // Parse JSON bodies
app.use(attachRequestId(logger)); // Attach request IDs

// Rate limiter for API endpoints
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize AgentManager
const agentManager = AgentManager.getInstance(logger);

// Routes
const router = express.Router();
router.use(apiRateLimiter); // Apply rate limiting
router.use(authenticate(logger, API_KEYS)); // Apply authentication

// Create agent endpoint
router.post(
  '/create',
  validateBody(agentConfigSchema, logger),
  asyncHandler(async (req: Request, res: Response) => {
    const config: AgentConfig = req.body;
    const agentId = await agentManager.createAgent(config);
    res.json({ success: true, agentId });
  })
);

// Run agent endpoint
router.post(
  '/agents/:name/run',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agentManager.runAgent(req.params.name, req.body as AgentTask);
    res.json({ success: true, result });
  })
);

// Register routes
app.use('/api', router);

// Global error handling
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(
    { reqId: req.id, error, url: req.url, method: req.method },
    'Unhandled error'
  );
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info({}, `Server running on port ${PORT}`);
});

export { app, asyncHandler, validateBody, agentConfigSchema };
