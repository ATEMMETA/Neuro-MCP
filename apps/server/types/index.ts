// apps/server/types/index.ts

/**
 * Exports all types for easy import (#TypeCentralization)
 */

export * from './api.types';
export * from './agent.types';

// Example of exporting agent-specific task/response interfaces individually
// (optional if you want to be explicit)
export { GithubAgentTask, GithubAgentResponse } from './agent.types';
