import { Router } from 'express';
import promClient from 'prom-client';

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
router.get('/ready', (_req, res) => res.status(200).send('READY'));
router.get('/metrics', async (_req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await register.metrics());
});

export default router;
