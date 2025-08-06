
// apps/server/agents/github-agent.ts
/**
 * Logic for GitHub API agent integration #AgentLogic
 */

import { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface ListIssuesTask {
  action: 'listIssues';
  owner: string;
  repo: string;
}

interface CreateIssueTask {
  action: 'createIssue';
  owner: string;
  repo: string;
  title: string;
  body?: string;
}

interface CreateCommentTask {
  action: 'createComment';
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
}

type GithubTask = ListIssuesTask | CreateIssueTask | CreateCommentTask;

export async function githubAgent(task: GithubTask): Promise<any> {
  try {
    switch (task.action) {
      case 'listIssues': {
        const issues = await octokit.issues.listForRepo({
          owner: task.owner,
          repo: task.repo,
        });
        return { issues: issues.data };
      }
      case 'createIssue': {
        const issue = await octokit.issues.create({
          owner: task.owner,
          repo: task.repo,
          title: task.title,
          body: task.body,
        });
        return { issue: issue.data, success: true };
      }
      case 'createComment': {
        const comment = await octokit.issues.createComment({
          owner: task.owner,
          repo: task.repo,
          issue_number: task.issueNumber,
          body: task.body,
        });
        return { comment: comment.data, success: true };
      }
      default:
        throw new Error(`Unknown GitHub agent action: ${(task as any).action}`);
    }
  } catch (error) {
    logger.error({ error, task }, 'GitHub agent task failed');
    throw error;
  }
}
