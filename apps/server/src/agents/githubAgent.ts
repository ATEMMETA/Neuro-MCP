// apps/server/src/agents/githubAgent.ts
import { AgentHandler, GithubAgentTask, GithubAgentResponse } from '../types';
import { Octokit } from 'octokit';

// Get GitHub token from environment variable
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

export const githubAgent: AgentHandler = async (task: GithubAgentTask): Promise<GithubAgentResponse> => {
  if (!octokit) {
    throw new Error('GitHub agent is not configured. GITHUB_TOKEN is missing.');
  }
  
  const { owner, repo } = task;

  switch (task.action) {
    case 'listIssues':
      const issues = await octokit.rest.issues.listForRepo({ owner, repo });
      return { issues: issues.data };
    
    case 'createIssue':
      if (!task.title) throw new Error('Issue title is required.');
      const newIssue = await octokit.rest.issues.create({ owner, repo, title: task.title, body: task.body });
      return { success: true, issue: newIssue.data };

    default:
      throw new Error(`Unknown githubAgent action: ${task.action}`);
  }
};
