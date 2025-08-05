
import express from 'express';
import { json } from 'body-parser';
import { logger } from './utils/logger';
import { AgentManager } from './services/AgentManager';

const app = express();
const port = process.env.PORT || 3000;

app.use(json());

// Simple health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount AgentManager related routes here (stub)
// Example: app.use('/agents', agentRouter); (to be implemented)

app.listen(port, () => {
  logger.info(`Server listening at http://localhost:${port}`);
});
