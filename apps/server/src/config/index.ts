import { config } from 'dotenv';
config();

export const CONFIG = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  agentsDir: process.env.AGENTS_DIR || './agents',
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
};
