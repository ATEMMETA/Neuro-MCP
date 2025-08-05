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
