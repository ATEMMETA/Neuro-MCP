// apps/cli/mcp-cli.ts
import { Command } from 'commander';
import { TmuxOrchestrator } from '../services/TmuxOrchestrator';
import { logger } from '../utils/logger';

const program = new Command();
const orchestrator = new TmuxOrchestrator();

program
  .name('mcp-cli')
  .description('A command-line interface for managing the Meta-AI Control Plane (MCP) sessions and tasks.')
  .version('1.0.0');

// Command to initialize a new session
program
  .command('init <sessionName>')
  .description('Initializes a new AI session with a given name.')
  .action(async (sessionName: string) => {
    logger.info(`Initializing new session: ${sessionName}`);
    try {
      await orchestrator.createSession(sessionName);
      logger.info(`Session '${sessionName}' created successfully.`);
    } catch (error) {
      logger.error(`Failed to create session '${sessionName}': ${error.message}`);
      process.exit(1);
    }
  });

// Command to run an AI task
program
  .command('run <sessionName>')
  .description('Runs an AI task with a specific prompt in a given session.')
  .option('-p, --prompt <prompt>', 'The AI task prompt.')
  .action(async (sessionName: string, options) => {
    if (!options.prompt) {
      logger.error('Error: A prompt is required to run a task. Use the -p or --prompt flag.');
      program.help();
    }
    logger.info(`Running AI task in session '${sessionName}' with prompt: '${options.prompt}'`);
    try {
      const result = await orchestrator.runAITask(sessionName, { prompt: options.prompt });
      logger.info('AI task completed. Output:');
      console.log(result.output);
    } catch (error) {
      logger.error(`Failed to run AI task in session '${sessionName}': ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

