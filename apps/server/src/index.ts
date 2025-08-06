/**
 * src/index.ts
 *
 * Main Express server entrypoint.
 * Integrates AgentManager, authentication, request ID assignment,
 * validation, error handling, middleware composition, OpenTelemetry tracing,
 * graceful shutdown, config validation, enhanced CORS, version endpoint,
 * and Prometheus metrics.
 */

import express, { RequestHandler, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { execSync } from 'child_process';

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
import { connectDB, closeDB } from './services/dbService'; // Add closeDB to cleanly disconnect if you don't have it
import cacheService from './services/cacheService'; // For graceful shutdown disconnect cleanup

// Utility: execute git commands for version info
function getGitCommitHash(): string | null {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return null;
  }
}

// Middleware: version endpoint for health checks and debugging
function versionEndpoint(_req: Request, res: Response) {
  res.json({
    version: config.APP_VERSION || 'unknown',
    commitHash: config.COMMIT_HASH || getGitCommitHash() || 'unknown',
    environment: config.NODE_ENV || 'unknown',
  });
}

async function startServer() {
  // 1. Validate essential environment variables upfront
  if (!config.PORT) {
    logger.error('Missing PORT env var');
    process.exit(1);
  }
  if (!config.API_KEYS || !config.JWT_SECRET) {
    logger.error('Missing API_KEYS or JWT_SECRET env vars');
    process.exit(1);
  }

  // 2. Initialize distributed tracing
  initializeTracing(
    'my-tmux-project',
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
  );

  // 3. Connect to databases, cache, queues, etc.
  await connectDB();
  await cacheService.connect?.(); // if cacheService has connect method

  // 4. Create Express app
  const app = express();

  // 5. Initialize AgentManager and register your agents
  const agentManager = AgentManager.getInstance(logger);
  agentManager.registerAgentHandler('claude-agent', claudeAgent);
  agentManager.registerAgentHandler('tmux-agent', tmuxAgent);
  agentManager.registerAgentHandler('github-agent', githubAgent);

  // 6. Compose global middlewares neatly
  const globalMiddlewares: RequestHandler[] = [
    helmet({
      // Add additional helmet security policies if needed
      contentSecurityPolicy: false,
      hsts: { maxAge: 31536000, includeSubDomains: true },
      referrerPolicy: { policy: 'no-referrer' },
    }),
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like curl)
        if (!origin) return callback(null, true);
        if ((config.CORS_ORIGINS || '').split(',').includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS policy violation'));
        }
      },
      credentials: true,
      optionsSuccessStatus: 204, // For legacy browsers preflight support
      preflightContinue: false,
    }),
    express.json({ limit: '10mb' }), // Protect from large body attacks
    attachRequestId,
    pinoHttp({ logger }),
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later' },
      skipSuccessfulRequests: true,
    }),
  ];
  globalMiddlewares.forEach((mw) => app.use(mw));

  // 7. Swagger API documentation endpoint (optionally protected in prod)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 8. Simple version info endpoint for operational support
  app.get('/version', versionEndpoint);

  // 9. Health endpoints (Prometheus instrumented)
  app.use('/health', healthController);

  // 10. Agent routes with stricter rate limiting + authentication
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
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
    }),
  ];

  // Mount these middlewares appropriately (order matters!)
  agentMiddlewares.forEach((mw) => app.use('/agents', mw));
  app.use('/agents', createAgentRouter(logger, agentManager));

  // 11. Centralized error handler (must be last!)
  app.use(errorHandler);

  // 12. Start server
  const server = app.listen(config.PORT, () => {
    logger.info({}, `🚀 Server running on port ${config.PORT}`);
  });

  // 13. Graceful shutdown handling with full resource cleanup
  async function shutdownHandler(signal: string) {
    try {
      logger.info({}, `${signal} received: shutting down gracefully...`);
      server.close(async () => {
        // Close DB, Cache, Queues, etc.
        await closeDB();
        await cacheService.disconnect?.();
        await agentManager.shutdown?.(); // If you add a shutdown method for cleanup in AgentManager
        logger.info({}, 'HTTP server closed, all resources cleaned up, exiting');
        process.exit(0);
      });

      // Force exit if shutdown takes too long
      setTimeout(() => {
        logger.error({}, 'Shutdown timeout reached, forcing exit!');
        process.exit(1);
      }, 10000);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  }

  // Listen for termination signals
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
}

// Run the server startup logic and catch errors
startServer().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
