import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';
import helmet from 'helmet';
app.use(helmet());
import { validateBody } from './middleware/validationMiddleware';
import { agentConfigSchema } from './validation/agentSchema';

router.post('/create', validateBody(agentConfigSchema), async (req, res) => {
  // validated at this point
});



export const validateBody = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    logger.warn(
      { reqId: (req as any).id, errors },
      'Request body validation failed'
    );

    return res.status(400).json({
      success: false,
      error: 'Invalid request payload',
      details: errors,
    });
  }

  // Replace request body with parsed/validated data to ensure consistent types
  req.body = result.data;
  next();
};
