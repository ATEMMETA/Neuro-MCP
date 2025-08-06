# Types for agent tasks and responses #TypeSafety
// apps/server/types/agent.types.ts

/**
 * Types for agent tasks and responses (#TypeSafety)
 */

// Claude agent example
export interface ClaudeAgentTask {
  prompt: string;
  temperature?: number;
}

export interface ClaudeAgentResponse {
  text: string;
  tokensUsed?: number;
}

// Tmux agent example
export interface TmuxAgentTask {
  command: string;
  sessionName?: string;
}

export interface TmuxAgentResponse {
  success: boolean;
  output?: string;
}

// GitHub agent example (from your snippet)
export interface GithubAgentTask {
  action: 'listIssues' | 'createIssue';
  owner: string;
  repo: string;
  title?: string;
  body?: string;
}

export interface GithubAgentResponse {
  issues?: any[];  // You may want to type better here with GitHub Issue schema
  issue?: any;
  success?: boolean;
}

// Union types representing any agent task/response
export type AgentTask = ClaudeAgentTask | TmuxAgentTask | GithubAgentTask;
export type AgentResponse = ClaudeAgentResponse | TmuxAgentResponse | GithubAgentResponse;
