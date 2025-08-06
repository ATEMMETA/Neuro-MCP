# Manages agent lifecycle and dispatching

/**
 * AgentManager.ts
 *
 * Manages agent lifecycle: registration, execution, retrieval, creation, and updating.
 * Designed for extensibility and integration with async processing (e.g., agentProcessor).
 */

import { logger } from '../utils/logger';

// Agent handler type (each agent exposes a function receiving task data and returning a Promise)
type AgentHandler = (task: any) => Promise<any>;

interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  capabilities?: string[];
  [key: string]: any;
}

class AgentManager {
  private agentHandlers = new Map<string, AgentHandler>();
  private agentsConfig = new Map<string, AgentConfig>();

  constructor() {
    // Could load initial agent configs from disk/config files or DB here
    // Example:
    // this.loadAgentConfig('claude-agent', require('../../config/agents/claude-agent.json'));
    // Or lazy load on demand
  }

  /**
   * Register an agent handler function by agent ID.
   * @param agentId - Unique agent string ID
   * @param handler - Function accepting a task, returning Promise with results
   */
  registerAgentHandler(agentId: string, handler: AgentHandler): void {
    if (this.agentHandlers.has(agentId)) {
      logger.warn(`Agent handler for '${agentId}' is being overwritten`);
    }
    this.agentHandlers.set(agentId, handler);
  }

  /**
   * List metadata for all registered or configured agents.
   * Returns array of agent configs.
   */
  listAgents(): AgentConfig[] {
    return Array.from(this.agentsConfig.values());
  }

  /**
   * Get detailed agent config by ID.
   * @param id Agent ID
   * @returns AgentConfig or undefined if not found
   */
  getAgentById(id: string): AgentConfig | undefined {
    return this.agentsConfig.get(id);
  }

  /**
   * Create or update an agent configuration and register handler if provided.
   * @param config Agent configuration object
   * @param handler Optional agent handler function
   * @returns The agent ID
   */
  async createAgent(config: AgentConfig, handler?: AgentHandler): Promise<string> {
    if (!config.id) {
      throw new Error('Agent config must have an id');
    }
    this.agentsConfig.set(config.id, config);
    if (handler) {
      this.registerAgentHandler(config.id, handler);
    }
    logger.info({ agentId: config.id }, 'Agent configuration saved');

    // TODO: Persist config to DB or file if needed

    return config.id;
  }

  /**
   * Update existing agent configuration.
   * @param id Agent ID to update
   * @param update Partial update for agent config
   */
  async updateAgent(id: string, update: Partial<AgentConfig>): Promise<void> {
    const existing = this.agentsConfig.get(id);
    if (!existing) {
      throw new Error(`Agent with id ${id} not found`);
    }
    const updated = { ...existing, ...update };
    this.agentsConfig.set(id, updated);
    logger.info({ agentId: id }, 'Agent configuration updated');

    // TODO: Persist update to DB or file if needed
  }

  /**
   * Run an agent by ID with a given task/payload.
   * Automatically throws if no registered handler.
   * @param agentId Agent ID
   * @param task Task payload for the agent handler
   * @returns Promise resolving to agent's result
   */
  async runAgent(agentId: string, task: any): Promise<any> {
    const handler = this.agentHandlers.get(agentId);
    if (!handler) {
      throw new Error(`No handler registered for agent '${agentId}'`);
    }

    logger.info({ agentId, task }, 'Executing agent task');
    const result = await handler(task);
    logger.info({ agentId, result }, 'Agent task completed');
    return result;
  }

  /**
   * Static convenience for simple use (optional).
   * Or consider changing class to singleton pattern as needed.
   */
  static instance: AgentManager | null = null;
  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  /**
   * (Optional) Static shorthand methods:
   */

  static async executeAgent(agentId: string, task: any): Promise<any> {
    return AgentManager.getInstance().runAgent(agentId, task);
  }

  static async createAgentStatic(config: AgentConfig, handler?: AgentHandler): Promise<string> {
    return AgentManager.getInstance().createAgent(config, handler);
  }

  static getAgentsList(): AgentConfig[] {
    return AgentManager.getInstance().listAgents();
  }

  static getAgentConfigById(id: string): AgentConfig | undefined {
    return AgentManager.getInstance().getAgentById(id);
  }
}

export { AgentManager, AgentConfig, AgentHandler };


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
