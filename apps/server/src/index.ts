import express from 'express';
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

if (!process.env.PORT) {
  logger.error('Missing PORT env var');
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT);

(async () => {
  // Connect to DB before starting server
  await connectDB();

  // Setup middleware
  app.use(helmet());
  app.use(cors({ origin: ['https://your-frontend.com'], credentials: true }));
  app.use(express.json());
  app.use(attachRequestId);
  app.use(pinoHttp({ logger }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(apiLimiter);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/health', healthController);

  // Register agents
  const agentManager = AgentManager.getInstance();
  agentManager.registerAgentHandler('claude-agent', claudeAgent);
  agentManager.registerAgentHandler('tmux-agent', tmuxAgent);
  agentManager.registerAgentHandler('github-agent', githubAgent);

  // Protect /agents routes
  app.use('/agents', authenticate);

  const agentLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: 'Too many agent requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/agents', agentLimiter);

  app.use('/agents', agentController);

  // Error handler last
  app.use(errorHandler);

  const server = app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
  });

  // Graceful shutdown
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
