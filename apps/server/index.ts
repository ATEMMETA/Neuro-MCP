/**
 * apps/server/index.ts
 *
 * Main Express server entrypoint — improved from minimal version.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { router as healthRouter } from './controllers/healthController';
import { router as agentRouter } from './controllers/agentController';

import { AgentManager } from './services/AgentManager';
import { claudeAgent } from './agents/claudeAgent';
import { tmuxAgent } from './agents/tmuxAgent';

import { logger, attachRequestId } from './middleware/requestId.middleware';
import { authenticate } from './middleware/authMiddleware';
import errorHandler from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';

const app = express();

const PORT = Number(process.env.PORT) || 3000;

// Register agent handlers upfront
const agentManager = AgentManager.getInstance();
agentManager.registerAgentHandler('claude-agent', claudeAgent);
agentManager.registerAgentHandler('tmux-agent', tmuxAgent);

// --- Middleware ---
app.use(helmet()); // For secure HTTP headers
app.use(cors()); // Enable CORS (adjust options if needed)
app.use(express.json()); // JSON request body parsing
app.use(attachRequestId); // Add unique request IDs to each request
app.use(pinoHttp({ logger })); // HTTP request logging with Pino

// Rate limiting (global)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: 'Too many requests from this IP, please try later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health endpoint - no auth needed
app.use('/health', healthRouter);

// Protection and rate limiting on agents route
app.use('/agents', authenticate);

const agentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 20,
  message: 'Too many agent requests, please try later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/agents', agentLimiter);

// Agents routes
app.use('/agents', agentRouter);

// Centralized error handling middleware - must be last
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received: shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
});
