# Centralized logging (e.g., Pino) #Observability
// apps/server/utils/logger.ts
import pino, { Logger, LoggerOptions } from 'pino';
import { pinoLoki } from 'pino-loki';

// Read Loki configuration from environment (set these in your .env or your deployment environment)
const LOKI_URL = process.env.LOKI_URL || '';
const LOKI_USERNAME = process.env.LOKI_USERNAME || '';
const LOKI_PASSWORD = process.env.LOKI_PASSWORD || '';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Base logger options: adjust levels and serializers if needed
const loggerOptions: LoggerOptions = {
  level: NODE_ENV === 'development' ? 'debug' : 'info',
  // you can add serializers here if you want to tweak object logging
  // serializers: { err: pino.stdSerializers.err }
};

// Create base pino logger instance with Loki transport if configured
const logger: Logger = LOKI_URL && LOKI_USERNAME && LOKI_PASSWORD
  ? pino({
      ...loggerOptions,
      transport: {
        target: 'pino-loki',
        options: {
          labels: { app: 'mcp-server' },
          batch: true,
          interval: 5,
          host: LOKI_URL,
          username: LOKI_USERNAME,
          password: LOKI_PASSWORD,
          // Optional tenant ID or other Loki options can go here
        },
      },
    })
  : pino(loggerOptions); // fallback to console logging in json format

// Helper to create child logger with additional context (e.g., requestId, user info)
function childLogger(context: Record<string, any>): Logger {
  return logger.child(context);
}

// Example usage:
// const log = childLogger({ requestId: '1234', userId: 'user-42' });
// log.info('User request processed');

export { logger, childLogger };
