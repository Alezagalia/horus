/* eslint-disable no-undef */
// JavaScript version of prisma.config.ts for production use
// Load .env file for local development
require('dotenv/config');

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
