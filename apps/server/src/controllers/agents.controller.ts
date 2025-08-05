// apps/server/src/controllers/agents.controller.ts (refined)
import { Request, Response } from 'express';
import { AgentManager } from '../services/AgentManager';
import { logger } from '../middleware/requestId.middleware';
import { WebSocket } from 'ws';

export const executeAgent = (agentManager: AgentManager) => async (req: Request, res: Response) => {
  const { agent, task } = req.body;
  const wsClient: WebSocket = req.ws; // Assume a middleware to attach the WS instance

  if (!agent || !task) {
    return res.status(400).json({ success: false, error: 'Agent and task are required.' });
  }

  try {
    // We'll simulate a long-running task to demonstrate WebSockets
    wsClient.send(JSON.stringify({ type: 'STATUS', message: 'Agent execution started...' }));

    // ... (rest of your agent execution logic remains the same) ...
    // Example of sending progress updates
    wsClient.send(JSON.stringify({ type: 'PROGRESS', percentage: 25, message: 'Processing data...' }));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ... agent returns final response ...

    wsClient.send(JSON.stringify({ type: 'STATUS', message: 'Agent execution finished successfully!' }));
    wsClient.send(JSON.stringify({ type: 'RESULT', data: result }));

    // The REST endpoint now just confirms the task was received
    res.status(202).json({ success: true, message: 'Task received, results will be sent via WebSocket.' });

  } catch (error) {
    logger.error('Agent execution error:', error);
    wsClient.send(JSON.stringify({ type: 'ERROR', message: 'An error occurred during execution.' }));
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
