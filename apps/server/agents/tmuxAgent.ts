# Logic for tmux session orchestration #AgentLogic
import { TmuxOrchestrator } from '../services/TmuxOrchestrator';
import { logger } from '../utils/logger';

const orchestrator = new TmuxOrchestrator();

interface ListSessionsTask { action: 'listSessions' }
interface CreateSessionTask { action: 'createSession'; sessionName: string }
interface CaptureContentTask { action: 'captureContent'; sessionName: string; windowIndex: number; numLines?: number }
interface SendCommandTask { action: 'sendCommand'; sessionName: string; windowIndex: number; command: string }
interface AITask { action: 'runAITask'; sessionName: string; prompt: string; model?: string }

type TmuxTask = ListSessionsTask | CreateSessionTask | CaptureContentTask | SendCommandTask | AITask;

export async function tmuxAgent(task: TmuxTask): Promise<any> {
  try {
    switch (task.action) {
      case 'listSessions':
        return { sessions: await orchestrator.listSessions() };
      case 'createSession':
        return { success: await orchestrator.createSession(task.sessionName) };
      case 'captureContent':
        return { content: await orchestrator.captureWindowContent(task.sessionName, task.windowIndex, task.numLines) };
      case 'sendCommand':
        return { success: await orchestrator.sendCommand(task.sessionName, task.windowIndex, task.command) };
      case 'runAITask':
        return { output: await orchestrator.runAITask(task.sessionName, { prompt: task.prompt, model: task.model }) };
      default:
        throw new Error(`Unknown task action: ${(task as any).action}`);
    }
  } catch (error) {
    logger.error({ error, task }, 'Tmux agent task failed');
    throw error;
  }
}
