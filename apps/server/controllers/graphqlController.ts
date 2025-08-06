# Optional GraphQL API for flexible querying #FutureProof
// apps/server/controllers/graphqlController.ts
/**
 * Optional GraphQL API for flexible querying (#FutureProof)
 */

import { Router } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';

// Sample GraphQL schema
const schema = buildSchema(`
  type Query {
    hello: String
    agentStatus(agentId: String!): String
  }
`);

// Sample root resolver
const root = {
  hello: () => 'Hello world!',
  agentStatus: (args: { agentId: string }) => {
    // Integration with AgentManager or status service could go here
    return `Status for agent ${args.agentId} is ACTIVE`;
  },
};

const router = Router();

router.use(
  '/',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: process.env.NODE_ENV !== 'production', // Enable graphiql only in dev
  })
);

export default router;
