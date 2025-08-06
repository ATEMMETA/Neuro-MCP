/**
 * agentSchema.ts
 *
 * Zod schemas for validating agent configurations and tasks.
 * Supports Claude, Tmux, and GitHub agents. (#DataIntegrity)
 */

import { z } from 'zod';

// Schema for AgentConfig
export const agentConfigSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
  name: z.string().min(1, 'Agent name is required'),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format'),
  capabilities: z.array(z.string()).optional(),
  config: z.record(z.any()).optional(),
  enabled: z.boolean().default(true),
  metadata: z
    .object({
      author: z.string().optional(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    })
    .optional(),
});

// Base schema for AgentTask
const baseAgentTaskSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Agent-specific task schemas
export const claudeAgentTaskSchema = baseAgentTaskSchema.extend({
  data: z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    temperature: z.number().min(0).max(1).optional(),
  }),
});

export const tmuxAgentTaskSchema = baseAgentTaskSchema.extend({
  data: z.object({
    command: z.string().min(1, 'Command is required'),
    sessionName: z.string().optional(),
  }),
});

export const githubAgentTaskSchema = baseAgentTaskSchema.extend({
  data: z.object({
    owner: z.string().min(1, 'Owner is required'),
    repo: z.string().min(1, 'Repo is required'),
    title: z.string().optional(),
    body: z.string().optional(),
  }),
});

// Union schema for AgentTask
export const agentTaskSchema = z.union([
  claudeAgentTaskSchema,
  tmuxAgentTaskSchema,
  githubAgentTaskSchema,
]);

// Compound schema for lists of agents
export const agentsConfigSchema = z.array(agentConfigSchema);

// Export inferred types
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type AgentsConfig = z.infer<typeof agentsConfigSchema>;
export type AgentTask = z.infer<typeof agentTaskSchema>;
export type ClaudeAgentTask = z.infer<typeof claudeAgentTaskSchema>;
export type TmuxAgentTask = z.infer<typeof tmuxAgentTaskSchema>;
export type GithubAgentTask = z.infer<typeof githubAgentTaskSchema>;
