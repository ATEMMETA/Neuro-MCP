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
