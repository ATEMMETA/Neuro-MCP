// #Bootstrap - Main Express server entrypoint for my-tmux-project

import express from 'express';
import { router as healthRouter } from './controllers/healthController';
import { router as agentRouter } from './controllers/agentController';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/health', healthRouter);
app.use('/agents', agentRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
agentManager.registerAgentHandler('claude-agent', () => import('./agents/claudeAgent').then(m => m.claudeAgent));
agentManager.registerAgentHandler('tmux-agent', () => import('./agents/tmuxAgent').then(m => m.tmuxAgent));
