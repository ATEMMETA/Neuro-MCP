import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { AgentManager } from './services/AgentManager';
import { claudeAgent } from './agents/claudeAgent';
import { tmuxAgent } from './agents/tmuxAgent';
import { logger, attachRequestId } from './middleware/requestId.middleware';
import healthController from './controllers/healthController';
import errorHandler from './middleware/errorHandler';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(attachRequestId);
app.use(pinoHttp({ logger }));

// Health and readiness endpoints
app.use('/health', healthController);

// Initialize Agent Manager
const agentManager = new AgentManager();
agentManager.registerAgentHandler('claude-agent', claudeAgent);
agentManager.registerAgentHandler('tmux-agent', tmuxAgent);

// API Routes
app.get('/agents', (_req, res) => {
  res.json(agentManager.listAgents());
});

app.post('/agents/:name/run', async (req, res) => {
  const agentName = req.params.name;
  try {
    const result = await agentManager.runAgent(agentName, req.body);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error({ err: error, agent: agentName, reqId: req.id }, 'Agent execution failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`🚀 MCP Server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { AgentManager } from './services/AgentManager';
import { claudeAgent } from './agents/claudeAgent';
import { tmuxAgent } from './agents/tmuxAgent';
import { logger, attachRequestId } from './middleware/requestId.middleware';
import healthController from './controllers/healthController';
import errorHandler from './middleware/errorHandler';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(attachRequestId);
app.use(pinoHttp({ logger }));

// Health and readiness endpoints
app.use('/health', healthController);

// Initialize Agent Manager
const agentManager = new AgentManager();
agentManager.registerAgentHandler('claude-agent', claudeAgent);
agentManager.registerAgentHandler('tmux-agent', tmuxAgent);

// API Routes
app.get('/agents', (_req, res) => {
  res.json(agentManager.listAgents());
});

app.post('/agents/:name/run', async (req, res) => {
  const agentName = req.params.name;
  try {
    const result = await agentManager.runAgent(agentName, req.body);
    res.json({ success: true, result });
  } catch (error: any) {
    logger.error({ err: error, agent: agentName, reqId: req.id }, 'Agent execution failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`🚀 MCP Server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});
// apps/server/src/index.ts (refined logger config)
import pino from 'pino';
import { pinoLoki } from 'pino-loki';

// Loki credentials from your Grafana Cloud account
const LOKI_URL = process.env.LOKI_URL; // e.g., 'https://<id>.<region>.grafana.net/loki/api/v1/push'
const LOKI_USERNAME = process.env.LOKI_USERNAME;
const LOKI_PASSWORD = process.env.LOKI_PASSWORD;

// Default logger config
const baseLogger = pino();

// Conditional transport for production/staging environments
const logger = LOKI_URL && LOKI_USERNAME && LOKI_PASSWORD ? pino({
  transport: {
    target: 'pino-loki',
    options: {
      labels: { app: 'mcp-server' },
      batch: true,
      interval: 5,
      host: LOKI_URL,
      username: LOKI_USERNAME,
      password: LOKI_PASSWORD,
    }
  }
}) : baseLogger;

// apps/server/src/index.ts (refined)
import rateLimit from 'express-rate-limit';
// ... other imports ...

// Global API Rate Limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max requests per IP
  message: 'Too many requests, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter limiter for high-value endpoints
const agentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Max requests per IP
  message: 'Too many agent requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ... in your main() function ...
app.use(apiLimiter); // Apply to all routes by default
app.use('/agents', agentLimiter); // Apply a stricter limit to the agents route

