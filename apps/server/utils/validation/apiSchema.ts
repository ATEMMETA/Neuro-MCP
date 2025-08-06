# Validation for API payloads #DataIntegrity
// apps/server/utils/validation/apiSchema.ts

import { z } from 'zod';

/**
 * Validation schemas for API payloads (#DataIntegrity)
 */

// Example: Payload for running an agent via API
export const runAgentPayloadSchema = z.object({
  // Agent-specific parameters. Adjust types as needed.
  parameters: z.record(z.any()).optional(), // flexible key-value pairs

  // Optionally specify environment or options for the agent run
  options: z
    .object({
      timeoutSeconds: z.number().int().positive().optional(),
      priority: z.enum(['low', 'normal', 'high']).optional(),
    })
    .optional(),
});

// Example: Pagination query parameters
export const paginationQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Example: Validation for a user authentication request body
export const authRequestSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(128),
});

// Export types inferred from schemas
export type RunAgentPayload = z.infer<typeof runAgentPayloadSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type AuthRequest = z.infer<typeof authRequestSchema>;
