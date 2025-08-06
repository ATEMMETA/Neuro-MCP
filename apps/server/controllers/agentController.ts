/**
 * agentController.ts
 *
 * Express routes for agent management and execution.
 * Supports creating agents and enqueueing agent run tasks.
 */

import { Router, Request, Response } from 'express';
import { validateBody } from '../middleware/validationMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { AgentManager, Logger } from '../services/AgentManager';
import { agentConfigSchema, agentTaskSchema } from '../utils/validation/agentSchema';
import { trace } from '@opentelemetry/api';
import { agentQueue } from '../jobs/agentProcessor';
import { RunAgentPayload } from '../types/api.types';

export function createAgentRouter(logger: Logger, agentManager: AgentManager): Router {
  const router = Router();

  // POST /create - Create a new agent with validated config
  router.post(
    '/create',
    validateBody(agentConfigSchema, logger),
    asyncHandler(async (req: Request, res: Response) => {
      const tracer = trace.getTracer('my-tmux-project');
      return tracer.startActiveSpan('create-agent', async (span) => {
        try {
          span.setAttribute('agent.id', req.body.id);
          const agentId = await agentManager.createAgent(req.body);
          span.setAttribute('agent.created', agentId);
          res.json({ success: true, agentId });
        } catch (error) {
          logger.error({ error, reqId: req.id, url: req.url }, 'Failed to create agent');
          res.status(500).json({ success: false, error: 'Failed to create agent' });
        } finally {
          span.end();
        }
      });
    }, logger)
  );

  // POST /:name/run - Validate and enqueue agent task for async processing
  router.post(
    '/:name/run',
    validateBody(agentTaskSchema, logger),
    asyncHandler(async (req: Request, res: Response) => {
      const tracer = trace.getTracer('my-tmux-project');
      return tracer.startActiveSpan('run-agent', async (span) => {
        const agentName = req.params.name;
        const taskPayload: RunAgentPayload = req.body;

        span.setAttribute('agent.name', agentName);
        span.setAttribute('task.action', taskPayload.action);
        try {
          const job = await agentQueue.add('runAgentTask', { agentName, task: taskPayload });
          res.status(202).json({
            success: true,
            message: 'Agent task enqueued',
            jobId: job.id,
          });
        } catch (error) {
          logger.error({ error, reqId: req.id, agentName, url: req.url }, 'Failed to enqueue agent task');
          res.status(500).json({ success: false, error: 'Failed to enqueue agent task' });
        } finally {
          span.end();
        }
      });
    }, logger)
  );

  return router;
}
