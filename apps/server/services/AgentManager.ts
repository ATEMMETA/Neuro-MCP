# Manages agent lifecycle and dispatching
import { AgentMetadata, AgentHandler } from '../types';

export class AgentManager {
  private handlers = new Map<string, () => Promise<AgentHandler>>();

  registerAgentHandler(name: string, loadHandler: () => Promise<AgentHandler>) {
    if (!this.agents.has(name)) {
      throw new Error(`Agent '${name}' metadata not found`);
    }
    this.handlers.set(name, loadHandler);
  }

  async runAgent(name: string, task: AgentTask): Promise<AgentResponse> {
    const loadHandler = this.handlers.get(name);
    if (!loadHandler) {
      throw new Error(`No handler registered for agent '${name}'`);
    }
    const handler = await loadHandler();
    return await handler(task);
  }
}
