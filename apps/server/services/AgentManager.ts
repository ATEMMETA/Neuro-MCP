# Manages agent lifecycle and dispatching
/**
 * AgentManager.ts
 *
 * Manages agent lifecycle: registration, execution, retrieval, creation, and updating.
 * Supports async handler loading, configuration persistence, and type-safe task handling.
 * Designed for extensibility and integration with async processing.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Logger interface for dependency injection
interface Logger {
  info: (metadata: any, message: string) => void;
  warn: (metadata: any, message: string) => void;
  error: (metadata: any, message: string) => void;
}

// Type definitions for agent tasks, responses, and handlers
interface AgentTask<T = unknown> {
  data: T;
  [key: string]: any;
}

interface AgentResponse<R = unknown> {
  result: R;
  [key: string]: any;
}

type AgentHandler<T = unknown, R = unknown> = (task: AgentTask<T>) => Promise<AgentResponse<R>>;

interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  capabilities?: string[];
  [key: string]: any;
}

class AgentManager {
  private agentHandlers = new Map<string, () => Promise<AgentHandler>>();
  private loadedHandlers = new Map<string, AgentHandler>();
  private agentsConfig = new Map<string, AgentConfig>();
  private configPath = path.join(__dirname, 'agent-configs.json');
  private static instance: AgentManager | null = null;

  constructor(private logger: Logger) {
    this.loadConfigsFromFile().catch(err => {
      this.logger.error({ err }, 'Failed to load agent configurations');
    });
  }

  /**
   * Load agent configurations from a JSON file.
   * @private
   */
  private async loadConfigsFromFile(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const configs = JSON.parse(data) as AgentConfig[];
      configs.forEach(config => {
        this.validateConfig(config);
        this.agentsConfig.set(config.id, config);
      });
      this.logger.info({}, 'Loaded agent configurations from file');
    } catch (error) {
      this.logger.warn({}, 'No existing agent config file found, starting fresh');
    }
  }

  /**
   * Save agent configurations to a JSON file.
   * @private
   */
  private async saveConfigsToFile(): Promise<void> {
    try {
      const configs = Array.from(this.agentsConfig.values());
      await fs.writeFile(this.configPath, JSON.stringify(configs, null, 2));
      this.logger.info({}, 'Saved agent configurations to file');
    } catch (error) {
      this.logger.error({ error }, 'Failed to save agent configurations');
      throw error;
    }
  }

  /**
   * Validate agent configuration.
   * @param config - Agent configuration to validate
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: AgentConfig): void {
    if (!config.id || typeof config.id !== 'string') {
      throw new Error('Agent config must have a valid string id');
    }
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Agent config must have a valid string name');
    }
    if (typeof config.enabled !== 'boolean') {
      throw new Error('Agent config must specify enabled as a boolean');
    }
  }

  /**
   * Register an agent handler function by agent ID, supporting async loading.
   * @param agentId - Unique agent string ID
   * @param loadHandler - Function that returns a Promise resolving to the agent handler
   */
  registerAgentHandler<T, R>(agentId: string, loadHandler: () => Promise<AgentHandler<T, R>>): void {
    if (!this.agentsConfig.has(agentId)) {
      this.logger.warn({ agentId }, 'Agent metadata not found during handler registration');
    }
    if (this.agentHandlers.has(agentId)) {
      this.logger.warn({ agentId }, 'Agent handler is being overwritten');
    }
    this.agentHandlers.set(agentId, loadHandler);
    this.loadedHandlers.delete(agentId); // Clear cached handler if overwritten
    this.logger.info({ agentId }, 'Agent handler registered');
  }

  /**
   * List metadata for all registered or configured agents.
   * @returns Array of agent configurations
   */
  listAgents(): AgentConfig[] {
    return Array.from(this.agentsConfig.values());
  }

  /**
   * Get detailed agent config by ID.
   * @param id - Agent ID
   * @returns AgentConfig or undefined if not found
   */
  getAgentById(id: string): AgentConfig | undefined {
    return this.agentsConfig.get(id);
  }

  /**
   * Create or update an agent configuration and register handler if provided.
   * @param config - Agent configuration object
   * @param loadHandler - Optional function to load agent handler asynchronously
   * @returns The agent ID
   * @throws Error if configuration is invalid
   */
  async createAgent<T, R>(config: AgentConfig, loadHandler?: () => Promise<AgentHandler<T, R>>): Promise<string> {
    this.validateConfig(config);
    this.agentsConfig.set(config.id, config);
    if (loadHandler) {
      this.registerAgentHandler(config.id, loadHandler);
    }
    await this.saveConfigsToFile();
    this.logger.info({ agentId: config.id }, 'Agent configuration saved');
    return config.id;
  }

  /**
   * Update existing agent configuration.
   * @param id - Agent ID to update
   * @param update - Partial update for agent config
   * @throws Error if agent not found or update is invalid
   */
  async updateAgent(id: string, update: Partial<AgentConfig>): Promise<void> {
    const existing = this.agentsConfig.get(id);
    if (!existing) {
      throw new Error(`Agent with id ${id} not found`);
    }
    const updated = { ...existing, ...update };
    this.validateConfig(updated);
    this.agentsConfig.set(id, updated);
    await this.saveConfigsToFile();
    this.logger.info({ agentId: id }, 'Agent configuration updated');
  }

  /**
   * Run an agent by ID with a given task/payload.
   * @param agentId - Agent ID
   * @param task - Task payload for the agent handler
   * @returns Promise resolving to the agent's result
   * @throws Error if no handler is registered or execution fails
   * @example
   * const result = await manager.runAgent('myAgent', { data: { value: 42 } });
   */
  async runAgent<T, R>(agentId: string, task: AgentTask<T>): Promise<AgentResponse<R>> {
    let handler = this.loadedHandlers.get(agentId);
    if (!handler) {
      const loadHandler = this.agentHandlers.get(agentId);
      if (!loadHandler) {
        throw new Error(`No handler registered for agent '${agentId}'`);
      }
      try {
        handler = await loadHandler();
        this.loadedHandlers.set(agentId, handler);
      } catch (error) {
        this.logger.error({ agentId, error }, 'Failed to load agent handler');
        throw new Error(`Failed to load handler for agent '${agentId}': ${error.message}`);
      }
    }
    try {
      this.logger.info({ agentId, task }, 'Executing agent task');
      const result = await handler(task);
      this.logger.info({ agentId, result }, 'Agent task completed');
      return result;
    } catch (error) {
      this.logger.error({ agentId, error }, 'Agent task failed');
      throw new Error(`Agent '${agentId}' execution failed: ${error.message}`);
    }
  }

  /**
   * Clear cached handler for an agent.
   * @param agentId - Agent ID
   */
  clearHandlerCache(agentId: string): void {
    this.loadedHandlers.delete(agentId);
    this.logger.info({ agentId }, 'Cleared cached handler');
  }

  /**
   * Singleton instance accessor.
   * @param logger - Logger instance for dependency injection
   * @returns Singleton instance of AgentManager
   */
  static getInstance(logger: Logger): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager(logger);
    }
    return AgentManager.instance;
  }

  /**
   * Static convenience methods for accessing singleton instance
   */

  static async executeAgent<T, R>(logger: Logger, agentId: string, task: AgentTask<T>): Promise<AgentResponse<R>> {
    return AgentManager.getInstance(logger).runAgent(agentId, task);
  }

  static async createAgentStatic<T, R>(
    logger: Logger,
    config: AgentConfig,
    loadHandler?: () => Promise<AgentHandler<T, R>>
  ): Promise<string> {
    return AgentManager.getInstance(logger).createAgent(config, loadHandler);
  }

  static getAgentsList(logger: Logger): AgentConfig[] {
    return AgentManager.getInstance(logger).listAgents();
  }

  static getAgentConfigById(logger: Logger, id: string): AgentConfig | undefined {
    return AgentManager.getInstance(logger).getAgentById(id);
  }
}

export { AgentManager, AgentConfig, AgentHandler, AgentTask, AgentResponse, Logger };
