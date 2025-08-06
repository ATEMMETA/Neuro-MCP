/**
 * AgentManager.ts
 *
 * Manages agent lifecycle: registration, execution, retrieval, creation, updating.
 * Supports async handler loading, dynamic config loading, caching, and validation.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { cacheService } from './cacheService'; // Assumed available cache service

interface Logger {
  info: (metadata: any, message: string) => void;
  warn: (metadata: any, message: string) => void;
  error: (metadata: any, message: string) => void;
}

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
  private agentsConfigDir = path.resolve(__dirname, '../../config/agents');
  private static instance: AgentManager | null = null;

  constructor(private logger: Logger) {
    this.loadConfigsFromFile().catch(err => {
      this.logger.error({ err }, 'Failed to load agent configurations');
    });
    // Additionally load from agents config folder asynchronously
    this.loadConfigsFromDir().catch(err => {
      this.logger.error({ err }, 'Failed to load agent configs from dir');
    });
  }

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

  async loadConfigsFromDir(): Promise<void> {
    try {
      const files = await fs.readdir(this.agentsConfigDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.agentsConfigDir, file);
          const jsonData = await fs.readFile(filePath, 'utf8');
          const config: AgentConfig = JSON.parse(jsonData);
          try {
            this.validateConfig(config);
            if (!this.agentsConfig.has(config.id)) {
              this.agentsConfig.set(config.id, config);
              this.logger.info({ agentId: config.id, file }, 'Loaded agent config dynamically');
            }
          } catch (configError) {
            this.logger.warn({ file, error: configError }, 'Skipping invalid agent config');
          }
        }
      }
      await this.saveConfigsToFile();
    } catch (error) {
      this.logger.error({ error }, 'Failed to load agent configs from directory');
      throw error;
    }
  }

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

  registerAgentHandler<T, R>(agentId: string, loadHandler: () => Promise<AgentHandler<T, R>>): void {
    if (!this.agentsConfig.has(agentId)) {
      this.logger.warn({ agentId }, 'Agent metadata not found during handler registration');
    }
    if (this.agentHandlers.has(agentId)) {
      this.logger.warn({ agentId }, 'Agent handler is being overwritten');
    }
    this.agentHandlers.set(agentId, loadHandler);
    this.loadedHandlers.delete(agentId);
    this.logger.info({ agentId }, 'Agent handler registered');
  }

  listAgents(): AgentConfig[] {
    return Array.from(this.agentsConfig.values());
  }

  getAgentById(id: string): AgentConfig | undefined {
    return this.agentsConfig.get(id);
  }

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

  private async getAgentHandler(agentId: string): Promise<AgentHandler> {
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
    return handler;
  }

  async runAgent<T, R>(agentId: string, task: AgentTask<T>): Promise<AgentResponse<R>> {
    const cacheKey = `${agentId}:${JSON.stringify(task)}`;
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      this.logger.info({ agentId, cacheKey }, 'Returning cached agent result');
      return cachedResult;
    }

    const handler = await this.getAgentHandler(agentId);
    try {
      this.logger.info({ agentId, task }, 'Executing agent task');
      const result = await handler(task);
      this.logger.info({ agentId, result }, 'Agent task completed');

      await cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      this.logger.error({ agentId, error }, 'Agent task failed');
      throw new Error(`Agent '${agentId}' execution failed: ${error.message}`);
    }
  }

  clearHandlerCache(agentId: string): void {
    this.loadedHandlers.delete(agentId);
    this.logger.info({ agentId }, 'Cleared cached handler');
  }

  static getInstance(logger: Logger): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager(logger);
    }
    return AgentManager.instance;
  }
}

export { AgentManager, AgentConfig, AgentHandler, AgentTask, AgentResponse, Logger };
