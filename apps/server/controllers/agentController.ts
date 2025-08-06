/**
 * agentController.ts
 *
 * Express routes for agent management and execution.
 */

import { Router, Request, Response } from 'express';
import { validateBody } from '../middleware/validationMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { AgentManager, Logger } from '../services/AgentManager';
import { agentConfigSchema, agentTaskSchema } from '../utils/validation/agentSchema';
import { trace } from '@opentelemetry/api';
import { agentQueue } from '../jobs/agentProcessor';
import { RunAgentPayload } from '../types/api.types';
import { StatusCodes } from 'http-status-codes'; // For readable HTTP status codes

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: string | string[];
  details?: any;
}

/**
 * Custom error class to represent HTTP errors.
 */
class HttpError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/**
 * Creates a router with agent-related routes.
 * @param logger Logger instance
 * @param agentManager AgentManager instance
 * @returns Express Router
 */
export function createAgentRouter(logger: Logger, agentManager: AgentManager): Router {
  const router = Router();

  /**
   * POST /create
   * Create a new agent with the given config.
   */
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

  /**
   * POST /:name/run
   * Validate and enqueue agent task for asynchronous processing.
   */
  router.post(
    '/:name/run',
    validateBody(agentTaskSchema, logger),
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
            data: {
              jobId: job.id,
            },
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

  return router;
}
