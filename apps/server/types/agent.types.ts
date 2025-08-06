/**
 * agent.types.ts
 *
 * TypeScript types for agent tasks and responses. (#TypeSafety)
 */

export interface BaseAgentTask {
  action: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface ClaudeAgentTask extends BaseAgentTask {
  data: {
    prompt: string;
    temperature?: number;
  };
}

export interface TmuxAgentTask extends BaseAgentTask {
  data: {
    command: string;
    sessionName?: string;
  };
}

export interface GithubAgentTask extends BaseAgentTask {
  data: {
    owner: string;
    repo: string;
    title?: string;
    body?: string;
  };
}

export interface ClaudeAgentResponse {
  result: {
    text: string;
    tokensUsed?: number;
  };
}

export interface TmuxAgentResponse {
  result: {
    success: boolean;
    output?: string;
  };
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
}

export interface GithubAgentResponse {
  result: {
    issues?: GithubIssue[];
    issue?: GithubIssue;
    success?: boolean;
  };
}

export type AgentTask = ClaudeAgentTask | TmuxAgentTask | GithubAgentTask;
export type AgentResponse = ClaudeAgentResponse | TmuxAgentResponse | GithubAgentResponse;

export type AgentHandler<T extends AgentTask = AgentTask, R extends AgentResponse = AgentResponse> = (
  task: T
) => Promise<R>;
