# One-command dev environment setup #Onboarding
/**
 * setup.ts
 *
 * One-command development environment setup script.
 *
 * Purpose:
 * - Install dependencies (if needed)
 * - Initialize databases (create schemas, seed data)
 * - Generate default config files or keys
 * - Preload or bootstrap agents configurations
 * - Provide developer-friendly outputs/hints
 *
 * Usage:
 * > ts-node scripts/dev/setup.ts
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function run() {
  console.log('Starting development environment setup...');

  try {
    // 1. Install dependencies (optional, depends if you want to automate)
    // execSync('npm install', { stdio: 'inherit' });

    // 2. Initialize / migrate database (example with a migration tool or raw SQL)
    console.log('Running database migrations...');
    // execSync('npm run migrate', { stdio: 'inherit' });

    // 3. Seed default data for dev environment (customize for your DB)
    console.log('Seeding database with initial data...');
    // await seedDatabase(); // implement your seeding logic here

    // 4. Generate or check environment/config files
    const envPath = path.resolve(__dirname, '../../.env.local');
    try {
      await fs.access(envPath);
      console.log('.env.local already exists');
    } catch {
      console.log('Creating default .env.local file with placeholders');
      await fs.writeFile(
        envPath,
        `
# Local environment variables
PORT=3000
API_KEYS=your-api-key
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:3000
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
`,
        'utf-8'
      );
    }

    // 5. Preload or validate agent configs
    console.log('Validating existing agent configurations...');
    // await validateAgentConfigs(); // Implement this function or check manually

    console.log('Development environment setup complete. You can now run `npm run dev`');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

run();
