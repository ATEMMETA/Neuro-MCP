export type AgentHandler = (task: AgentTask) => Promise<AgentResponse>;

export class AgentManager {
  // ... existing code ...
  async runAgent(name: string, task: AgentTask): Promise<AgentResponse> {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No handler registered for agent '${name}'`);
    }
    return await handler(task);
  }
}
