# Validation for agent configurations #DataIntegrity
// apps/server/utils/validation/agentSchema.ts

import { z } from 'zod';

/**
 * Validation schemas for agent configurations (#DataIntegrity)
 */

// Basic agent configuration schema
export const agentConfigSchema = z.object({
  id: z.string().min(1),                       // Unique agent identifier
  name: z.string().min(1),                     // Human-readable agent name
  description: z.string().optional(),          // Optional description
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format'),  // e.g., '1.0.0'

  // Agent capabilities or features as string array
  capabilities: z.array(z.string()).optional(),

  // Configuration for agent behavior or parameters
  config: z.record(z.any()).optional(),

  // Is the agent enabled or disabled
  enabled: z.boolean().default(true),

  // Optional metadata, like author or created date
  metadata: z
    .object({
      author: z.string().optional(),
      createdAt: z.string().optional(), // ISO date string recommended
      updatedAt: z.string().optional(),
    })
    .optional(),
});

// Compound schema if you have lists of agents
export const agentsConfigSchema = z.array(agentConfigSchema);

// Export types inferred from schemas
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type AgentsConfig = z.infer<typeof agentsConfigSchema>;
