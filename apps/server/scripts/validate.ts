import { execa, ExecaError } from 'execa';
import chalk from 'chalk';
import { globby } from 'globby';
import { execSync } from 'child_process';

const CHUNK_SIZE = 100;

const validateAll = process.argv.includes('--all') || process.env.VALIDATE_ALL === 'true';

async function getChangedFiles(): Promise<string[]> {
  if (validateAll) {
    console.log(chalk.blue('ℹ️  Validating all files due to --all flag or VALIDATE_ALL=true'));
    return globby(['src/**/*.{ts,tsx}', '*.{json,md}'], { gitignore: true });
  }

  try {
    // Try staged files first, then fallback to diff with origin/main
    const diff = execSync(
      'git diff --name-only --cached || git diff --name-only origin/main',
      { encoding: 'utf-8' }
    );
    const files = diff
      .split('\n')
      .filter(file => /\.(ts|tsx|json|md)$/.test(file) && file.trim() !== '');

    if (files.length) {
      console.log(chalk.blue(`ℹ️  Found ${files.length} changed file(s) to validate.`));
      return files;
    }

    // Fallback if no changed files
    console.log(chalk.yellow('⚠️ No changed files detected. Validating all files...'));
    return globby(['src/**/*.{ts,tsx}', '*.{json,md}'], { gitignore: true });
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Could not get git changes. Validating all files...'));
    return globby(['src/**/*.{ts,tsx}', '*.{json,md}'], { gitignore: true });
  }
}

async function runCheck(command: string, args: string[], label: string): Promise<void> {
  try {
    console.log(chalk.blue(`🔍 Running ${label}...`));
    await execa(command, args, { stdio: 'inherit' });
    console.log(chalk.green(`✅ ${label} passed`));
  } catch (error: unknown) {
    const execaError = error as ExecaError;
    console.error(chalk.red(`❌ ${label} failed: ${execaError.message}`));
    throw execaError;
  }
}

async function runInBatches(
  command: string,
  label: string,
  files: string[],
  additionalArgs: string[] = []
): Promise<void> {
  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    const batch = files.slice(i, i + CHUNK_SIZE);
    const batchLabel = `${label} batch ${Math.floor(i / CHUNK_SIZE) + 1}`;
    await runCheck(command, [...batch, ...additionalArgs], batchLabel);
  }
}

async function main() {
  const files = await getChangedFiles();

  if (!files.length) {
    console.log(chalk.yellow('⚠️ No files found to validate. Skipping all checks.'));
    return;
  }

  // Define the checks to run
  const checks = [
    {
      cmd: 'tsc',
      args: ['--noEmit'],
      label: 'TypeScript Type Check',
      batch: false, // no batching needed because no files passed
    },
    {
      cmd: 'eslint',
      args: ['--max-warnings=0'],
      label: 'ESLint Lint',
      batch: true,
    },
    {
      cmd: 'prettier',
      args: ['--check'],
      label: 'Prettier Format',
      batch: true,
    },
  ];

  // Run all checks in parallel, handle batching for eslint/prettier
  const results = await Promise.all(
    checks.map(({ cmd, args, label, batch }) => {
      if (batch) {
        return runInBatches(cmd, label, files, args)
          .then(() => ({ label, success: true }))
          .catch(() => ({ label, success: false }));
      } else {
        return runCheck(cmd, args, label)
          .then(() => ({ label, success: true }))
          .catch(() => ({ label, success: false }));
      }
    })
  );

  // Process results and report
  const failedChecks = results.filter(r => !r.success);
  if (failedChecks.length > 0) {
    console.error(
      chalk.red(
        `❌ ${failedChecks.length} validation check(s) failed: ${failedChecks
          .map(c => c.label)
          .join(', ')}`
      )
    );
    process.exit(1);
  }

  console.log(chalk.bgGreen.black('🎉 All validations passed!'));
}

main().catch(error => {
  console.error(chalk.red('💥 Unexpected error during validation:'), error);
  process.exit(1);
});
