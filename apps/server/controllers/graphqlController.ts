# Optional GraphQL API for flexible querying #FutureProof
// apps/server/controllers/graphqlController.ts
import { Router } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { AgentManager } from '../services/AgentManager';

const schema = buildSchema(`
  type Agent {
    id: String!
    name: String!
    description: String
    enabled: Boolean!
  }

  input AgentInput {
    id: String
    name: String!
    description: String
    enabled: Boolean
  }

  type Query {
    agents: [Agent!]!
    agent(id: String!): Agent
  }

  type Mutation {
    createAgent(input: AgentInput!): Agent
    updateAgent(id: String!, input: AgentInput!): Agent
  }
`);

const root = {
  agents: () => {
    // Return list of agents from AgentManager
    return AgentManager.listAgents();
  },
  agent: ({ id }: { id: string }) => {
    return AgentManager.getAgentById(id);
  },
  createAgent: async ({ input }: { input: any }) => {
    const id = await AgentManager.createAgent(input);
    return AgentManager.getAgentById(id);
  },
  updateAgent: async ({ id, input }: { id: string; input: any }) => {
    await AgentManager.updateAgent(id, input);
    return AgentManager.getAgentById(id);
  },
};

const router = Router();

router.use(
  '/',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: process.env.NODE_ENV !== 'production',
  })
);

export default router;
