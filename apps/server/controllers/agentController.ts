// apps/server/controllers/agentController.ts
/**
 * #AgentAPI - API routes for agent management and execution
 */

import { Router, Request, Response } from 'express';
import { AgentManager } from '../services/AgentManager';

const router = Router();

// Get agent details or execute agent by ID (adjust method if needed)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const agentId = req.params.id;
    // Assuming AgentManager has a method to get agent info or execute
    const result = await AgentManager.executeAgent(agentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute agent' });
  }
});

// Create a new agent configuration
router.post('/create', async (req: Request, res: Response) => {
  try {
    const agentConfig = req.body;
    const agentId = await AgentManager.createAgent(agentConfig);
    res.json({ id: agentId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

export { router };
