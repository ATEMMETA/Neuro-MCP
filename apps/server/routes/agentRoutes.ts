// routes/agentRoutes.ts
const router = Router();
router.get('/', ...);
router.post('/:name/run', ...);
export default router;

// In main file:
import agentRouter from './routers/agentRouter';
app.use('/agents', authenticate, agentLimiter, agentRouter);

// routers/agentRouter.ts
import { Router } from 'express';
const router = Router();

router.post('/:name/run', asyncHandler(async (req, res) => {
  // handler logic
}));

export default router;

// index.ts
import agentRouter from './routers/agentRouter';
app.use('/v1/agents', authenticate, rateLimiter, agentRouter);
