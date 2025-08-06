import { execa } from 'execa';
import chalk from 'chalk';
import { globby } from 'globby';

async function getChangedFiles(): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['diff', '--name-only', 'origin/main...HEAD']);
    const files = stdout.split('\n').filter(f => f.match(/\.(ts|tsx|json|md)$/));
    return files.length ? files : await globby(['src/**/*.{ts,tsx,json,md}'], { gitignore: true });
  } catch {
    return await globby(['src/**/*.{ts,tsx,json,md}'], { gitignore: true });
  }
}

async function runCheck(command: string, args: string[], label: string) {
  try {
    console.log(chalk.blue(`🔍 Running ${label}...`));
    await execa(command, args, { stdio: 'inherit' });
    console.log(chalk.green(`✅ ${label} passed`));
  } catch (error: any) {
    console.error(chalk.red(`❌ ${label} failed: ${error.message}`));
    process.exit(1);
  }
}

async function main() {
  const files = await getChangedFiles();
  if (!files.length) {
    console.log(chalk.yellow('⚠️ No files changed. Skipping validation.'));
    return;
  }

  await runCheck('tsc', ['--noEmit'], 'TypeScript Type Check');
  await runCheck('eslint', [...files, '--max-warnings=0'], 'ESLint Lint');
  await runCheck('prettier', ['--check', ...files], 'Prettier Format');

  console.log(chalk.bgGreen.black('🎉 All validations passed!'));
}

main();
import { execa } from 'execa';
import chalk from 'chalk';
import { globby } from 'globby';
import { execSync } from 'child_process';

async function runCheck(command: string, args: string[], label: string) {
  try {
    console.log(chalk.blue(`🔍 ${label}...`));
    await execa(command, args, { stdio: 'inherit' });
    console.log(chalk.green(`✅ ${label} passed`));
    return true;
  } catch (error: any) {
    console.error(chalk.red(`❌ ${label} failed: ${error.message}`));
    throw error;
  }
}

async function getChangedFiles(): Promise<string[]> {
  try {
    const diff = execSync('git diff --name-only --cached || git diff --name-only origin/main', { encoding: 'utf-8' });
    const files = diff.split('\n').filter(file => file.match(/\.(ts|tsx|json|md)$/));
    return files.length ? files : await globby(['src/**/*.{ts,tsx}', '*.{json,md}'], { gitignore: true });
  } catch (error) {
    console.warn(chalk.yellow('⚠️ No git changes detected, falling back to full validation'));
    return globby(['src/**/*.{ts,tsx}', '*.{json,md}'], { gitignore: true });
  }
}

async function validate() {
  const files = await getChangedFiles();
  if (!files.length) {
    console.log(chalk.yellow('⚠️ No files to validate. Skipping...'));
    return;
  }

  const checks = [
    { cmd: 'tsc', args: ['--noEmit'], label: 'TypeScript Type Check' },
    { cmd: 'eslint', args: [...files, '--max-warnings=0'], label: 'ESLint' },
    { cmd: 'prettier', args: ['--check', ...files], label: 'Prettier Format' },
  ];

  for (const { cmd, args, label } of checks) {
    await runCheck(cmd, args, label);
  }
  console.log(chalk.bgGreen.black('🎉 All validations passed!'));
}

validate().catch(() => process.exit(1));
