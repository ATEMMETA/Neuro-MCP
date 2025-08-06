/**
 * agents.ws.controller.ts
 *
 * WebSocket handler for real-time execution of agents with live status/progress updates.
 */

import { Request, Response } from 'express';
import { AgentManager } from '../services/AgentManager';
import { logger } from '../middleware/requestId.middleware';
import { WebSocket } from 'ws';

export const executeAgentWS = (agentManager: AgentManager) => async (req: Request & { ws?: WebSocket }, res: Response) => {
  const { agent, task } = req.body;
  const wsClient = req.ws; // Assume WS client attached via middleware

  if (!wsClient) {
    return res.status(400).json({ success: false, error: 'WebSocket client not connected.' });
  }

  if (!agent || !task) {
    return res.status(400).json({ success: false, error: 'Agent and task are required.' });
  }

  try {
    wsClient.send(JSON.stringify({ type: 'STATUS', message: 'Agent execution started...' }));

    // Send mock progress updates as example
    wsClient.send(JSON.stringify({ type: 'PROGRESS', percentage: 25, message: 'Processing data...' }));
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Run agent task synchronously or however your AgentManager supports
    const result = await agentManager.runAgent(agent, task);

    wsClient.send(JSON.stringify({ type: 'STATUS', message: 'Agent execution finished successfully!' }));
    wsClient.send(JSON.stringify({ type: 'RESULT', data: result }));

    // Confirm task reception via REST
    res.status(202).json({ success: true, message: 'Task received, results will be sent via WebSocket.' });

  } catch (error) {
    logger.error('Agent execution error:', error);
    wsClient.send(JSON.stringify({ type: 'ERROR', message: 'An error occurred during execution.' }));
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
