# Async task queue for agents (e.g., BullMQ) #AsyncProcessing
// apps/server/jobs/agentProcessor.ts
/**
 * Async task queue for agents (#AsyncProcessing)
 */

import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import { AgentManager } from '../services/AgentManager';
import { logger } from '../utils/logger';

// Redis connection options (adjust environment variables as needed)
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// Create queue and scheduler instances
export const agentQueue = new Queue('agentQueue', { connection });
const queueScheduler = new QueueScheduler('agentQueue', { connection });

// Worker processes the jobs in the queue
const worker = new Worker(
  'agentQueue',
  async (job: Job) => {
    const { agentName, task } = job.data;
    logger.info({ agentName, jobId: job.id }, 'Processing agent job');

    try {
      const result = await AgentManager.runAgent(agentName, task);
      return result; // job completed with result
    } catch (error) {
      logger.error({ error, agentName, jobId: job.id }, 'Agent job failed');
      throw error;
    }
  },
  { connection }
);

// Worker error handling
worker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, err }, 'Agent job failed');
});

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Agent job completed successfully');
});

// Gracefully close worker and queue on shutdown if needed
process.on('SIGTERM', async () => {
  logger.info('Shutting down BullMQ worker and queue...');
  await worker.close();
  await agentQueue.close();
  await queueScheduler.close();
  process.exit(0);
});
