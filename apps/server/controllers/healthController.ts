/**
 * healthController.ts
 *
 * Health, readiness, and Prometheus metrics endpoints.
 */

import { Router } from 'express';
import promClient from 'prom-client';
import dbService from '../services/dbService';
import cacheService from '../services/cacheService';

const router = Router();
const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path'],
  registers: [register],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

router.use((req, _res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  req.on('end', () => {
    httpRequestsTotal.inc({ method: req.method, path: req.path });
    end();
  });
  next();
});

router.get('/health', (_req, res) => res.status(200).send('OK'));

router.get('/ready', async (_req, res) => {
  try {
    const dbReady = await dbService.ping();
    const cacheReady = await cacheService.ping();
    // Add other readiness checks if needed
    const isReady = dbReady && cacheReady;

    res.status(isReady ? 200 : 503).send(isReady ? 'READY' : 'NOT READY');
  } catch {
    res.status(503).send('NOT READY');
  }
});

router.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

export default router;
