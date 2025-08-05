# Guidelines for contributors #Community

# Contributing to my-tmux-project

Thank you for your interest in contributing! Here's how to get started.

## Getting Started
1. Fork the repository and clone it locally.
2. Follow `docs/TERMINUX_SETUP.md` for environment setup.
3. Install dependencies: `npm install` (monorepo root) and `npm install` in `apps/server/` or `apps/mobile-app/`.

## Development Workflow
- Create a branch: `git checkout -b feature/your-feature-name`.
- Write tests in `tests/` for new features or bug fixes.
- Run linters and formatters: `npm run lint` and `npm run format`.
- Commit changes with clear messages (use Husky hooks in `.husky/`).
- Submit a pull request with a description of changes.

## Code Style
- Follow ESLint rules in `.eslintrc.json`.
- Use Prettier for formatting (`.prettierrc`).
- Write TypeScript types in `types/` for shared interfaces.

## Testing
- Add unit tests in `tests/unit/`.
- Add integration tests in `tests/integration/`.
- Run tests: `npm test`.

## Documentation
- Update `docs/REFINEMENT_LOG.md` with major changes.
- Add examples to `docs/EXAMPLES.md` for new features.
- Document APIs in `docs/api/openapi.yml`.

## Questions?
Reach out via GitHub Issues or [your-contact-channel].
