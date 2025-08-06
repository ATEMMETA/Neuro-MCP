# Loads env vars and composes config #12Factor
/**
 * apps/server/config/index.ts
 *
 * Loads environment variables and composes the overall configuration.
 * Follows 12-factor app principles for environment-based config.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({
    path: path.resolve(process.cwd(), '.env')
  });
}

interface Config {
  port: number;
  databaseUrl: string;
  redisUrl?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  // Add other top-level config fields here

  // Agents configuration folder path
  agentsConfigPath: string;
}

// Compose config from environment variables and defaults
const config: Config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/mcp-db',
  redisUrl: process.env.REDIS_URL,
  logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
  agentsConfigPath: path.resolve(process.cwd(), 'apps/server/config/agents'),
};

export default config;
