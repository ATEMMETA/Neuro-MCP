# CLI entrypoint (e.g., using Commander.js) #CLI
// apps/cli/src/index.ts
/**
 * CLI entrypoint for my-tmux-project CLI (#CLI)
 */

import { Command } from 'commander';
import { initializeCommands } from '../mcp-cli';

const program = new Command();

program
  .name('mcp-cli')
  .description('Command line interface for managing MCP sessions and tasks.')
  .version('1.0.0');

// Initialize all CLI commands from mcp-cli.ts file
initializeCommands(program);

program.parse(process.argv);
