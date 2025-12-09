/* eslint-disable no-undef */
// JavaScript version of prisma.config.ts for production use
// Use process.env directly - dotenv not needed as env vars are injected by Docker
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

module.exports = {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
};
