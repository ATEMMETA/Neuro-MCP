// routes/agentRoutes.ts
const router = Router();
router.get('/', ...);
router.post('/:name/run', ...);
export default router;

// In main file:
import agentRouter from './routers/agentRouter';
app.use('/agents', authenticate, agentLimiter, agentRouter);
