#!/bin/bash
echo "Setting up MCP backend..."
# Install dependencies
npm install --save-dev typescript eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin execa ts-node globby chalk husky lint-staged pino pino-loki swagger-jsdoc swagger-ui-express
npm install express shell-quote
# Setup Husky
npx husky init
echo "npm run lint-staged" > .husky/pre-commit
echo "npm run validate" > .husky/pre-push
# Create directories and files
mkdir -p src/{utils,middleware,controllers,services,agents} agents scripts docs
touch src/utils/logger.ts src/controllers/healthController.ts src/services/{AgentManager,TmuxOrchestrator}.ts src/agents/tmuxAgent.ts
touch agents/tmux-agent.json scripts/validate.ts docs/TERMUX_SETUP.md
# Setup configs
cat <<EOL > .eslintrc.json
{
  "env": { "node": true, "es2021": true },
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": { "ecmaVersion": 12, "sourceType": "module" },
  "plugins": ["@typescript-eslint"],
  "rules": { "no-console": "warn" }
}
EOL
cat <<EOL > .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80
}
EOL
# Setup CI/CD
mkdir -p .github/workflows
cat <<EOL > .github/workflows/validate-and-deploy.yml
# [Insert CI/CD workflow from above]
EOL
# Setup Docker
cat <<EOL > Dockerfile
# [Insert Dockerfile from above]
EOL
cat <<EOL > docker-compose.yml
# [Insert docker-compose.yml from above]
EOL
echo "Setup complete! Run 'npm run validate' to test."
