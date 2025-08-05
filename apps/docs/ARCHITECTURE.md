  # System architecture with diagrams #SystemDesign
# System Architecture

## Overview
The MCP system orchestrates AI and system agents via a Node.js Express server, with a React Native mobile client for interaction. Validation and CI/CD ensure code quality.

## Workflow Diagram
```mermaid
graph TD
  A[Mobile Client] -->|POST /agents/:name/run| B[Express Server]
  B --> C[AgentManager]
  C -->|Loads Metadata| D[agents/*.json]
  C -->|Executes| E[Agent Handlers]
  E -->|Tmux Commands| F[TmuxOrchestrator]
  E -->|AI Tasks| G[Claude API (Placeholder)]
  B -->|Logs| H[Pino Logger]
  B -->|Metrics| I[/metrics Endpoint]
  J[GitHub Actions] -->|Validates| K[scripts/validate.ts]
  J -->|Deploys| L[Vercel/Render]
