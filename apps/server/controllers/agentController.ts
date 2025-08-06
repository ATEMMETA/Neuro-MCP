/**
 * agentController.ts
 *
 * RESTful Express routes for agent management, task queuing,
 * dynamic validation, and error handling.
 */

import { Router, Request, Response } from 'express';
import { validateBody } from '../middleware/validationMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { AgentManager, Logger } from '../services/AgentManager';
import {
  agentConfigSchema,
  agentTaskSchema,
  claudeAgentTaskSchema,
  tmuxAgentTaskSchema,
  githubAgentTaskSchema,
} from '../utils/validation/agentSchema';
import { trace } from '@opentelemetry/api';
import { agentQueue } from '../jobs/agentProcessor';
import { RunAgentPayload } from '../types/api.types';
import { StatusCodes } from 'http-status-codes';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: string | string[];
  details?: any;
}

class HttpError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Map of agent task validation schemas by agent name
const schemas: Record<string, ReturnType<typeof agentTaskSchema>> = {
  'claude-agent': claudeAgentTaskSchema,
  'tmux-agent': tmuxAgentTaskSchema,
  'github-agent': githubAgentTaskSchema,
};

export function createAgentRouter(logger: Logger, agentManager: AgentManager): Router {
  const router = Router();

  // POST /create - Create agent
  router.post(
    '/create',
    validateBody(agentConfigSchema, logger),
    asyncHandler(async (req: Request, res: Response<SuccessResponse<{ agentId: string }> | ErrorResponse>) => {
      const tracer = trace.getTracer('my-tmux-project');
      return await tracer.startActiveSpan('create-agent', async (span) => {
        try {
          span.setAttribute('agent.id', req.body.id);
          const agentId = await agentManager.createAgent(req.body);
          span.setAttribute('agent.created', agentId);
          res.status(StatusCodes.CREATED).json({ success: true, data: { agentId } });
        } catch (error: any) {
          logger.error({ error, reqId: req.id, url: req.url }, 'Failed to create agent');
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message });
          throw new HttpError('Failed to create agent', StatusCodes.INTERNAL_SERVER_ERROR, error);
        } finally {
          span.end();
        }
      });
    }, logger)
  );

  // POST /:name/run - Enqueue agent task with dynamic schema validation
  router.post(
    '/:name/run',
    (req, res, next) => {
      const agentName = req.params.name;
      const schema = schemas[agentName] || agentTaskSchema;
      return validateBody(schema, logger)(req, res, next);
    },
    asyncHandler(async (req: Request, res: Response<SuccessResponse<{ jobId: string }> | ErrorResponse>) => {
      const tracer = trace.getTracer('my-tmux-project');
      return await tracer.startActiveSpan('run-agent', async (span) => {
        const agentName = req.params.name;
        const taskPayload: RunAgentPayload = req.body;
        span.setAttribute('agent.name', agentName);
        span.setAttribute('task.action', taskPayload.action);

        try {
          const job = await agentQueue.add('runAgentTask', { agentName, task: taskPayload });

          res.status(StatusCodes.ACCEPTED).json({
            success: true,
            data: { jobId: job.id },
          });
        } catch (error: any) {
          logger.error({ error, reqId: req.id, agentName, url: req.url }, 'Failed to enqueue agent task');
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message });
          throw new HttpError('Failed to enqueue agent task', StatusCodes.INTERNAL_SERVER_ERROR, error);
        } finally {
          span.end();
        }
      });
    }, logger)
  );

  // POST /queue - Offline/CLI enqueuing endpoint
  router.post(
    '/queue',
    validateBody(agentTaskSchema, logger),
    asyncHandler(async (req: Request, res: Response<SuccessResponse<{ jobId: string }> | ErrorResponse>) => {
      const tracer = trace.getTracer('my-tmux-project');
      return await tracer.startActiveSpan('queue-agent-task', async (span) => {
        try {
          const taskPayload: RunAgentPayload = req.body;
          const job = await agentQueue.add('runAgentTask', { agentName: taskPayload.agentName, task: taskPayload });

          res.status(StatusCodes.ACCEPTED).json({
            success: true,
            data: { jobId: job.id },
          });
        } catch (error: any) {
          logger.error({ error, reqId: req.id, url: req.url }, 'Failed to enqueue offline agent task');
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message });
          throw new HttpError('Failed to enqueue offline agent task', StatusCodes.INTERNAL_SERVER_ERROR, error);
        } finally {
          span.end();
        }
      });
    }, logger)
  );

  return router;
}
