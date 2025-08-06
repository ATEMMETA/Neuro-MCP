/**
 * index.ts
 *
 * Main Express server entrypoint, integrating AgentManager, authentication,
 * request ID, validation, error handling, middleware composition, and tracing.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { AgentManager, Logger } from './services/AgentManager';
import { claudeAgent } from './agents/claudeAgent';
import { tmuxAgent } from './agents/tmuxAgent';
import { attachRequestId } from './middleware/requestId.middleware';
import { authenticate } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { compose } from './middleware/compose';
import { initializeTracing } from './monitoring/opentelemetry';
import { swaggerSpec } from './config/swagger';
import { createAgentRouter } from './controllers/agentController';
import { router as healthRouter } from './controllers/healthController';

// Extend Express Request interface for type-safe request ID
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// Logger (from utils/logger.ts)
import { logger } from './utils/logger';

// Initialize OpenTelemetry
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
initializeTracing('my-tmux-project', otlpEndpoint);

// Initialize API keys and JWT secret
const API_KEYS = new Set(
  process.env.API_KEYS?.split(',').map((key) => key.trim()) || []
);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
if (API_KEYS.size === 0 && !JWT_SECRET) {
  logger.error({}, 'No API_KEYS or JWT_SECRET set. Exiting.');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Initialize AgentManager
const agentManager = AgentManager.getInstance(logger);

// Register agent handlers
agentManager.registerAgentHandler('claude-agent', claudeAgent);
agentManager.registerAgentHandler('tmux-agent', tmuxAgent);

// Apply global middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(attachRequestId(logger)); // Attach request IDs
app.use(pinoHttp({ logger })); // HTTP request logging

// Global rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { success: false, error: 'Too many requests, please try later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// Agent-specific rate limiting
const agentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 20,
  message: { success: false, error: 'Too many agent requests, please try later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/health', healthRouter); // No auth needed
app.use(
  '/agents',
  compose([authenticate(logger, API_KEYS, JWT_SECRET), agentLimiter], logger),
  createAgentRouter(logger, agentManager)
);

// Global error handling
app.use(errorHandler(logger));

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info({}, `🚀 Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info({}, 'SIGTERM received: shutting down gracefully...');
  server.close(() => {
    logger.info({}, 'HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error({}, 'Shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
});

export { app };
