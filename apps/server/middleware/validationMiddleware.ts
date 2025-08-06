// apps/server/middleware/validationMiddleware.ts
import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

export const validateBody = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err: any) {
    res.status(400).json({ error: err.errors });
  }
};
