# Health and readiness endpoints #Observability
// apps/server/controllers/healthController.ts
import { Router, Request, Response } from 'express';
import client from 'prom-client';
import dbService from '../services/dbService';
import cacheService from '../services/cacheService';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check DB connectivity
    const dbReady = await dbService.ping(); // returns true/false

    // Check Redis cache connectivity
    const cacheReady = await cacheService.ping();

    // Add other readiness checks (e.g., tmuxOrchestrator)
    const isReady = dbReady && cacheReady; // combine as needed

    if (isReady) {
      res.status(200).send('READY');
    } else {
      res.status(503).send('NOT READY');
    }
  } catch (e) {
    res.status(503).send('NOT READY');
  }
});

router.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

export default router;
