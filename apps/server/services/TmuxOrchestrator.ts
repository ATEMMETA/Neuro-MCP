# Handles tmux session interactions #SystemIntegration
import { exec } from 'child_process';
import { promisify } from 'util';
import shellQuote from 'shell-quote';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface TmuxSession {
  name: string;
  attached: boolean;
  windows: number;
}

export class TmuxOrchestrator {
  async listSessions(): Promise<TmuxSession[]> {
    try {
      const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}:#{session_attached}:#{session_windows}"');
      return stdout.trim().split('\n').filter(Boolean).map(line => {
        const [name, attached, windows] = line.split(':');
        return { name, attached: attached === '1', windows: parseInt(windows, 10) };
      });
    } catch (error) {
      logger.error({ error }, 'Failed to list tmux sessions');
      return [];
    }
  }

  async createSession(sessionName: string): Promise<boolean> {
    const safeSessionName = shellQuote.quote([sessionName]);
    try {
      await execAsync(`tmux new-session -d -s ${safeSessionName}`);
      logger.info({ sessionName }, 'Created tmux session');
      return true;
    } catch (error) {
      logger.error({ error, sessionName }, 'Failed to create tmux session');
      return false;
    }
  }

  async captureWindowContent(sessionName: string, windowIndex: number, numLines = 50): Promise<string> {
    const safeSessionName = shellQuote.quote([sessionName]);
    const safeNumLines = Math.min(numLines, 1000);
    try {
      const { stdout } = await execAsync(`tmux capture-pane -t ${safeSessionName}:${windowIndex} -p -S -${safeNumLines}`);
      logger.info({ sessionName, windowIndex }, 'Captured tmux window content');
      return stdout;
    } catch (error) {
      logger.error({ error, sessionName, windowIndex }, 'Failed to capture tmux window');
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async sendCommand(sessionName: string, windowIndex: number, command: string): Promise<boolean> {
    const safeSessionName = shellQuote.quote([sessionName]);
    const safeCommand = shellQuote.quote([command]);
    try {
      await execAsync(`tmux send-keys -t ${safeSessionName}:${windowIndex} ${safeCommand} C-m`);
      logger.info({ sessionName, windowIndex, command }, 'Sent command to tmux session');
      return true;
    } catch (error) {
      logger.error({ error, sessionName, windowIndex, command }, 'Failed to send command');
      return false;
    }
  }

  async runAITask(sessionName: string, task: { prompt: string; model?: string }): Promise<string> {
    const safeSessionName = shellQuote.quote([sessionName]);
    try {
      // Placeholder for AI model integration (e.g., Claude, Grok)
      const command = `echo "${task.prompt}" | ${task.model || 'mock-ai'}`;
      await execAsync(`tmux send-keys -t ${safeSessionName}:0 ${shellQuote.quote([command])} C-m`);
      const output = await this.captureWindowContent(sessionName, 0);
      logger.info({ sessionName, task }, 'Ran AI task in tmux session');
      return output;
    } catch (error) {
      logger.error({ error, sessionName, task }, 'Failed to run AI task');
      throw error;
    }
  }
  }
