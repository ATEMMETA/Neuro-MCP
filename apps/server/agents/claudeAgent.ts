# Logic for Claude AI agent integration #AgentLogic
// apps/server/agents/claudeAgent.ts
/**
 * Logic for Claude AI agent integration #AgentLogic
 */

import { Anthropic, type SDKMessage } from '@anthropic-ai/sdk'; // Official Anthropic SDK
import { logger } from '../utils/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Task type for Claude Agent
 */
interface ClaudeAgentTask {
  prompt: string;
  model?: string; // Optional model variant
  maxTokens?: number;
  temperature?: number;
}

/**
 * Response type for Claude Agent
 */
interface ClaudeAgentResponse {
  completion: string;
  rawResponse: any; // Raw SDK response if you want to surface that
}

/**
 * The main Claude agent function
 * @param task ClaudeAgentTask object with prompt and optional options
 * @returns Promise resolving to ClaudeAgentResponse
 */
export async function claudeAgent(task: ClaudeAgentTask): Promise<ClaudeAgentResponse> {
  try {
    if (!task.prompt) {
      throw new Error('Prompt text is required');
    }

    // Build messages structure for chat - Anthropic uses chat-like messages format
    const messages: SDKMessage[] = [{ role: 'user', content: task.prompt }];

    // Call the Anthropic Claude SDK to generate response
    const response = await anthropic.messages.create({
      model: task.model || 'claude-3-opus-20240229', // default recommended model
      messages,
      max_tokens_to_sample: task.maxTokens ?? 1000,
      temperature: task.temperature ?? 0.7,
    });

    const completion = response.choices?.[0]?.message?.content || '';

    logger.info({ prompt: task.prompt, model: task.model }, 'Claude agent completed prompt');

    return { completion, rawResponse: response };
  } catch (error) {
    logger.error({ error, task }, 'Claude agent failed');
    throw error;
  }
      }
