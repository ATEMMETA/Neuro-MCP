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
import { tmuxAgent } from './agents/tmuxAgent';

// After creating agentManager instance
agentManager.registerAgentHandler('tmux-agent', tmuxAgent);

// Add API endpoint for AI tasks
app.post('/agents/:name/run-ai', async (req, res) => {
  const agentName = req.params.name;
  const task = { action: 'runAITask', sessionName: req.body.sessionName, prompt: req.body.prompt, model: req.body.model };
  try {
    const result = await agentManager.runAgent(agentName, task);
    res.json({ success: true, result });
  } catch (e: any) {
    logger.error({ reqId: (req as any).id, error: e.message }, 'AI task error');
    res.status(500).json({ success: false, error: e.message });
  }
});
