import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs } from '@/server/infrastructure/graphql/schema';
import { resolvers } from '@/server/infrastructure/graphql/resolvers';

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: '/api/agent/graphql',
  fetchAPI: { Response },
  landingPage: false,
});

export const GET = yoga;
export const POST = yoga;
