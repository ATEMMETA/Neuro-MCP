# Health and readiness endpoints #Observability
// apps/server/src/controllers/healthController.ts
import { Router } from 'express';
const router = Router();

router.get('/health', (_req, res) => res.status(200).send('OK'));
router.get('/ready', (_req, res) => {
  // Add logic to check critical services (e.g., database connection, tmux status)
  res.status(200).send('READY');
});
router.get('/metrics', (_req, res) => {
  // Prometheus metrics endpoint goes here
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP http_requests_total Total HTTP requests\nhttp_requests_total{method="get"} 1027`);
});

export default router;
