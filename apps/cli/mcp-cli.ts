// apps/cli/mcp-cli.ts
import { Command } from 'commander';
import { TmuxOrchestrator } from '../services/TmuxOrchestrator';
import { logger } from '../utils/logger';

const orchestrator = new TmuxOrchestrator();

/**
 * Initialize and attach CLI commands to the Commander program instance.
 *
 * @param program Commander Command instance
 */
export function initializeCommands(program: Command) {
  // Command to initialize new session
  program
    .command('init <sessionName>')
    .description('Initializes a new AI session with a given name.')
    .action(async (sessionName: string) => {
      logger.info(`Initializing new session: ${sessionName}`);
      try {
        await orchestrator.createSession(sessionName);
        logger.info(`Session '${sessionName}' created successfully.`);
      } catch (error: any) {
        logger.error(`Failed to create session '${sessionName}': ${error.message}`);
        process.exit(1);
      }
    });

  // Command to run AI task
  program
    .command('run <sessionName>')
    .description('Runs an AI task with a specific prompt in a given session.')
    .requiredOption('-p, --prompt <prompt>', 'The AI task prompt.')
    .action(async (sessionName: string, options: { prompt: string }) => {
      logger.info(`Running AI task in session '${sessionName}' with prompt: '${options.prompt}'`);
      try {
        const result = await orchestrator.runAITask(sessionName, { prompt: options.prompt });
        logger.info('AI task completed. Output:');
        console.log(result.output);
      } catch (error: any) {
        logger.error(`Failed to run AI task in session '${sessionName}': ${error.message}`);
        process.exit(1);
      }
    });
}
