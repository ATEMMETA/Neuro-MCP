export interface ClaudeAgentTask {
  prompt: string;
}

export interface ClaudeAgentResponse {
  text: string;
}

export interface TmuxAgentTask {
  action: 'listSessions' | 'captureWindow' | 'sendCommand';
  sessionName?: string;
  windowIndex?: number;
  command?: string;
  numLines?: number;
}

export interface TmuxAgentResponse {
  sessions?: string[];
  content?: string;
  success?: boolean;
}

export type AgentTask = ClaudeAgentTask | TmuxAgentTask;
export type AgentResponse = ClaudeAgentResponse | TmuxAgentResponse;
