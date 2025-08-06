// apps/server/src/index.ts

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
import agentController from './controllers/agentController';
import errorHandler from './middleware/errorHandler';
import { connectDB } from './services/dbService';

import { config } from './config/env';

console.log(`Starting server on port ${config.PORT}`);
// use config.PORT, config.API_KEY, etc. safely

// Middleware composition helper
function compose(middlewares: RequestHandler[]): RequestHandler {
  return (req, res, next) => {
    let index = -1;
    function dispatch(i: number): void {
      if (i <= index) return next(new Error('next() called multiple times'));
      index = i;
      const fn = middlewares[i];
      if (!fn) return next();
      try {
        fn(req, res, (err?: any) => {
          if (err) return next(err);
          dispatch(i + 1);
        });
      } catch (err) {
        next(err);
      }
    }
    dispatch(0);
  };
}

if (!process.env.PORT) {
  logger.error('Missing PORT env var');
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT);

(async () => {
  await connectDB();

  // Register agents early
  const agentManager = AgentManager.getInstance();
  agentManager.registerAgentHandler('claude-agent', claudeAgent);
  agentManager.registerAgentHandler('tmux-agent', tmuxAgent);
  agentManager.registerAgentHandler('github-agent', githubAgent);

  // Global middlewares composed
  const globalMiddlewares = compose([
    helmet(),
    cors({ origin: ['https://your-frontend.com'], credentials: true }),
    express.json(),
    attachRequestId,
    pinoHttp({ logger }),
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  ]);
  app.use(globalMiddlewares);

  // Swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Public health routes without auth
  app.use('/health', healthController);

  // Middleware stack for /agents routes (auth + stricter rate limit)
  const agentsMiddlewares = compose([
    authenticate,
    rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 20,
      message: 'Too many agent requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  ]);
  app.use('/agents', agentsMiddlewares, agentController);

  // Centralized error handler at the end
  app.use(errorHandler);

  const server = app.listen(port, () => {
    logger.info(`🚀 Server running at http://localhost:${port}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down...');
    server.close(() => {
      logger.info('Server closed, exiting');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown!');
      process.exit(1);
    }, 10000);
  });
})();
