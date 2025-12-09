#!/bin/sh
set -e

echo "=== Horus Backend Startup ==="

# Push database schema (creates tables if they don't exist)
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

echo "Database schema synced successfully!"

# Start the application
echo "Starting application..."
exec node dist/index.js
