/**
 * authMiddleware.ts
 *
 * Middleware for securing Express endpoints with API key authentication,
 * request validation, and error handling. Integrates with AgentManager for
 * agent-related operations.
 */

import { Request, Response, NextFunction } from 'express';
import { AgentManager, AgentConfig, AgentTask, AgentResponse, Logger } from './AgentManager';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Extend Express Request interface for type-safe request ID
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// Mock validation schema for AgentConfig (replace with actual schema as needed)
const agentConfigSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
  name: z.string().min(1, 'Agent name is required'),
  enabled: z.boolean(),
  description: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
});

// Validation middleware
const validateBody = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      logger.error({ reqId: req.id, error }, 'Request body validation failed');
      res.status(400).json({ success: false, error: 'Invalid request body', details: error.message });
    }
  };
};

// Logger interface (consistent with AgentManager)
interface Logger {
  info: (metadata: any, message: string) => void;
  warn: (metadata: any, message: string) => void;
  error: (metadata: any, message: string) => void;
}

// Async handler for consistent error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error({ reqId: req.id, error, url: req.url, method: req.method }, 'Request handler error');
      res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
      next(error);
    });
  };
};

// Rate limiter for API key endpoints
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware
export function authenticate(logger: Logger, apiKeys: Set<string>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('x-api-key');
    if (!apiKey || !apiKeys.has(apiKey)) {
      logger.warn(
        {
          reqId: req.id,
          url: req.url,
          method: req.method,
          ip: req.ip,
        },
        'Unauthorized access attempt'
      );
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key' });
    }
    logger.info({ reqId: req.id, url: req.url, method: req.method }, 'Authenticated request');
    next();
  };
}

// Example Express app setup
import express from 'express';

// Mock logger (replace with actual logger implementation)
const logger: Logger = {
  info: (meta, msg) => console.log(`INFO: ${msg}`, meta),
  warn: (meta, msg) => console.warn(`WARN: ${msg}`, meta),
  error: (meta, msg) => console.error(`ERROR: ${msg}`, meta),
};

// Initialize API keys from environment (support multiple keys)
const API_KEYS = new Set(
  process.env.API_KEYS?.split(',').map((key) => key.trim()) || []
);
if (API_KEYS.size === 0) {
  logger.error({}, 'No API_KEYS environment variable set. Exiting.');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Apply global security middleware
app.use(helmet()); // Secure HTTP headers
app.use(express.json()); // Parse JSON bodies
app.use((req, res, next) => {
  req.id = Math.random().toString(36).slice(2); // Mock request ID (replace with proper middleware)
  next();
});

// Initialize AgentManager
const agentManager = AgentManager.getInstance(logger);

// Routes with authentication and rate limiting
const router = express.Router();
router.use(apiRateLimiter); // Apply rate limiting to all routes
router.use(authenticate(logger, API_KEYS)); // Apply authentication

// Create agent endpoint
router.post(
  '/create',
  validateBody(agentConfigSchema),
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

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ reqId: req.id, error, url: req.url, method: req.method }, 'Unhandled error');
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server (example)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info({}, `Server running on port ${PORT}`);
});

export { asyncHandler, validateBody, agentConfigSchema };
