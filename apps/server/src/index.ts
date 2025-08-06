/**
 * index.ts
 *
 * Main Express server entrypoint, integrating AgentManager, authentication,
 * request ID, validation, error handling, middleware composition, and tracing.
 */

import express, { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { AgentManager } from './services/AgentManager';
import { claudeAgent } from './agents/claudeAgent';
import { tmuxAgent } from './agents/tmuxAgent';
import { githubAgent } from './agents/github-agent';
import { attachRequestId, logger } from './middleware/requestId.middleware';
import { authenticate } from './middleware/authMiddleware';
import healthController from './controllers/healthController';
import { createAgentRouter } from './controllers/agentController';
import errorHandler from './middleware/errorHandler';
import { initializeTracing } from './monitoring/opentelemetry';
import { config } from './config/env';
import { connectDB } from './services/dbService';

async function startServer() {
  // Validate essential configs early
  if (!config.PORT) {
    logger.error('Missing PORT env var');
    process.exit(1);
  }
  if (!config.API_KEYS || !config.JWT_SECRET) {
    logger.error('Missing API_KEYS or JWT_SECRET env vars');
    process.exit(1);
  }

  // Initialize OpenTelemetry tracing
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
  initializeTracing('my-tmux-project', otlpEndpoint);

  // Connect to databases/services before starting server
  await connectDB();

  // Create Express app
  const app = express();

  // Initialize AgentManager and register agent handlers
  const agentManager = AgentManager.getInstance(logger);
  agentManager.registerAgentHandler('claude-agent', claudeAgent);
  agentManager.registerAgentHandler('tmux-agent', tmuxAgent);
  agentManager.registerAgentHandler('github-agent', githubAgent);

  // Compose and mount global middlewares
  const globalMiddlewares: RequestHandler[] = [
    helmet(),
    cors({ origin: ['https://your-frontend.com'], credentials: true }),
    express.json(),
    attachRequestId,
    pinoHttp({ logger }),
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { success: false, error: 'Too many requests, please try again later' },
    }),
  ];
  globalMiddlewares.forEach((mw) => app.use(mw));

  // Swagger API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Public health endpoints
  app.use('/health', healthController);

  // Middleware stack for agent routes: authentication + stricter rate limiting
  const agentMiddlewares: RequestHandler[] = [
    authenticate(
      logger,
      new Set(config.API_KEYS.split(',').map((k) => k.trim())),
      config.JWT_SECRET
    ),
    rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 20,
      message: { success: false, error: 'Too many agent requests, please try again later' },
    }),
  ];

  // Mount agent REST API router with agent-related middlewares
  agentMiddlewares.forEach((mw) => app.use('/agents', mw));
  app.use('/agents', createAgentRouter(logger, agentManager));

  // Centralized error handling (last)
  app.use(errorHandler);

  // Start the server
  const server = app.listen(config.PORT, () => {
    logger.info(`🚀 Server running on port ${config.PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      logger.info('HTTP server closed, exiting');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 10000);
  });
}

// Start server and catch initialization errors
startServer().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});

