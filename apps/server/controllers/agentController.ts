// #AgentAPI - API routes for agent management and execution

import { Router } from 'express';
import { AgentManager } from '../services/AgentManager';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const agentId = req.params.id;
    const result = await AgentManager.executeAgent(agentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute agent' });
  }
});

router.post('/create', async (req, res) => {
  try {
    const agentConfig = req.body;
    const agentId = await AgentManager.createAgent(agentConfig);
    res.json({ id: agentId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

export { router };
