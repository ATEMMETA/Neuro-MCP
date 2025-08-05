# Exports all types for easy import #TypeCentralization
// ... existing types ...
export interface GithubAgentTask {
  action: 'listIssues' | 'createIssue';
  owner: string;
  repo: string;
  title?: string;
  body?: string;
}

export interface GithubAgentResponse {
  issues?: any[];
  issue?: any;
  success?: boolean;
}

export type AgentTask = ClaudeAgentTask | TmuxAgentTask | GithubAgentTask;
export type AgentResponse = ClaudeAgentResponse | TmuxAgentResponse | GithubAgentResponse;
// ... in main() function ...
const agentManager = new AgentManager();
agentManager.registerAgentHandler('claude-agent', claudeAgent);
agentManager.registerAgentHandler('tmux-agent', tmuxAgent);
agentManager.registerAgentHandler('github-agent', githubAgent); // <-- New agent!
