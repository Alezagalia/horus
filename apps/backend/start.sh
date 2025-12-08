#!/bin/sh
echo "=== Environment Check ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL exists: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'no')"
echo "JWT_SECRET exists: $([ -n "$JWT_SECRET" ] && echo 'yes' || echo 'no')"
echo "JWT_REFRESH_SECRET exists: $([ -n "$JWT_REFRESH_SECRET" ] && echo 'yes' || echo 'no')"
echo "=== Starting server ==="
exec node dist/index.js
