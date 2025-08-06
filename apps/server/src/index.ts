import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { AgentManager } from './services/AgentManager';
import { claudeAgent } from './agents/claudeAgent';
import { tmuxAgent } from './agents/tmuxAgent';
import { attachRequestId, logger } from './middleware/requestId.middleware';
import { authenticate } from './middleware/authMiddleware';
import healthController from './controllers/healthController';
import errorHandler from './middleware/errorHandler';

// Environment Variable Validation (example)
if (!process.env.PORT) {
  logger.error('Missing required PORT environment variable. Exiting...');
  process.exit(1);
}

// Initialize Express app
const app = express();
const port = Number(process.env.PORT);

// Middleware: Secure HTTP headers
app.use(helmet());

// Middleware: Enable CORS (adjust origins as needed)
app.use(
  cors({
    origin: ['https://your-frontend.com'], // Replace with your allowed origins or remove to allow all
    credentials: true,
  })
);

// Middleware: Body parsing for JSON
app.use(express.json());

// Middleware: Attach unique request IDs to requests
app.use(attachRequestId);

// Middleware: HTTP request logger with Pino
app.use(pinoHttp({ logger }));

// Rate limiting: Global API rate limit (100 requests / 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// Serve Swagger UI docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Unauthenticated health check routes
app.use('/health', healthController);

// Initialize Agent Manager & register agents
const agentManager = new AgentManager();
agentManager.registerAgentHandler('claude-agent', claudeAgent);
agentManager.registerAgentHandler('tmux-agent', tmuxAgent);

// Apply authentication middleware to all /agents routes
app.use('/agents', authenticate);

// Stricter rate limiting on /agents routes (20 requests / 5 minutes)
const agentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: 'Too many agent requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/agents', agentLimiter);

// Async handler wrapper to ensure async errors propagate correctly to error handler
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Agent-related routes inline (can be moved to routes/agentRoutes.ts)
app.get(
  '/agents',
  asyncHandler(async (_req, res) => {
    res.json(agentManager.listAgents());
  })
);

app.post(
  '/agents/:name/run',
  asyncHandler(async (req, res) => {
    const agentName = req.params.name;
    const result = await agentManager.runAgent(agentName, req.body);
    res.json({ success: true, result });
  })
);

// TODO: Add JSON Schema validation middleware here if needed,
// e.g., using Zod or Joi to validate agent run payloads

// Centralized error handler middleware (must be last)
app.use(errorHandler);

// Start HTTP server and save reference to close on graceful shutdown
const server = app.listen(port, () => {
  logger.info(`🚀 MCP Server running at http://localhost:${port}`);
});

// Graceful shutdown handling
let shuttingDown = false;
process.on('SIGTERM', () => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed remaining connections.');
    process.exit(0);
  });
  // Force exit after 10 seconds if not closed
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
});
