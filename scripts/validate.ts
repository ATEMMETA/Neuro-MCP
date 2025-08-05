import { execa } from 'execa';

async function runValidation() {
  try {
    console.log('🔍 Running TypeScript type check...');
    await execa('tsc', ['--noEmit'], { stdio: 'inherit' });

    console.log('🔧 Running ESLint...');
    await execa('eslint', ['src/**/*.{ts,tsx}', '--max-warnings=0'], { stdio: 'inherit' });

    console.log('🎨 Running Prettier check...');
    await execa('prettier', ['--check', 'src/**/*.{ts,tsx,json,md}'], { stdio: 'inherit' });

    console.log('✅ All validations passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

runValidation();
