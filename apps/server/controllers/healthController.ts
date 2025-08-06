# Health and readiness endpoints #Observability
// apps/server/controllers/healthController.ts
/**
 * Health and readiness endpoints (#Observability)
 */

import { Router, Request, Response } from 'express';
import client from 'prom-client';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

router.get('/ready', async (_req: Request, res: Response) => {
  // TODO: Add real health checks here (DB, agent connectivity, etc.)
  // For example, await dbService.ping() or tmuxOrchestrator.status()
  res.status(200).send('READY');
});

router.get('/metrics', async (_req: Request, res: Response) => {
  // Serve Prometheus metrics collected via prom-client
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

export default router;

