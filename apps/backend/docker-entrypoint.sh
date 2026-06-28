#!/bin/sh
set -e

echo "=== Horus Backend Startup ==="

# Sync database schema (creates tables/columns if they don't exist).
#
# NOTE: we deliberately do NOT pass --accept-data-loss. Additive changes (new
# tables/columns) apply normally; but if schema.prisma ever diverges in a way
# that would DROP a column/table, `db push` aborts and the deploy fails loudly
# instead of silently destroying production data. Investigate + back up before
# forcing such a change. (Long-term: move to `prisma migrate deploy` — S-07.1.)
echo "Syncing database schema..."
npx prisma db push

echo "Database schema synced successfully!"

# Start the application
echo "Starting application..."
exec node dist/index.js
