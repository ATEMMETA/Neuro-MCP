// apps/server/controllers/agentController.ts
import { Router, Request, Response } from 'express';
import { agentQueue } from '../jobs/agentProcessor';
import { RunAgentPayload } from '../types/api.types';

const router = Router();

// Enqueue an agent run task instead of running inline
router.post('/:name/run', async (req: Request, res: Response) => {
  const agentName = req.params.name;
  const taskPayload: RunAgentPayload = req.body;

  try {
    const job = await agentQueue.add('runAgentTask', {
      agentName,
      task: taskPayload,
    });
    res.status(202).json({
      message: 'Agent task enqueued',
      jobId: job.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enqueue agent task' });
  }
});

export { router };
