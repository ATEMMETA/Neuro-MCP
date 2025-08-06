# Validates code, configs, and agents #QualityAssurance
/**
 * validate.ts
 *
 * Continuous Integration (CI) validation script.
 *
 * Purpose:
 * - Run linting and formatting checks (ESLint, Prettier)
 * - Run unit and integration tests with coverage thresholds
 * - Validate agent configuration schemas
 * - Optionally perform static analysis or security scans
 *
 * Usage:
 * > ts-node scripts/ci/validate.ts
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { agentConfigSchema } from '../../utils/validation/agentSchema';

async function validateAgentConfigs() {
  console.log('Validating agent configurations...');
  const configsDir = path.resolve(__dirname, '../../config/agents');
  let success = true;

  try {
    const files = await fs.readdir(configsDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(configsDir, file);
        const raw = await fs.readFile(filePath, 'utf-8');
        const config = JSON.parse(raw);

        try {
          agentConfigSchema.parse(config);
          console.log(`✅ ${file} is valid.`);
        } catch (validationError) {
          console.error(`❌ ${file} is invalid:`, validationError.errors || validationError);
          success = false;
        }
      }
    }
  } catch (error) {
    console.error('Failed to list or read agent configs:', error);
    success = false;
  }

  return success;
}

async function run() {
  try {
    console.log('Running ESLint...');
    execSync('npm run lint', { stdio: 'inherit' });

    console.log('Running Prettier check...');
    execSync('npm run format:check', { stdio: 'inherit' }); // assuming format:check script exists

    console.log('Running tests...');
    execSync('npm test -- --coverage --silent', { stdio: 'inherit' });

    const agentsValid = await validateAgentConfigs();
    if (!agentsValid) {
      console.error('Agent configuration validation failed.');
      process.exit(1);
    }

    // Add additional static checks here (e.g., type checking: tsc --noEmit)

    console.log('All validations passed successfully!');
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

run();
