#!/bin/sh
set -e

echo "=== Horus Backend Startup ==="

# Apply pending migrations (S-07.1). We use `migrate deploy` instead of
# `db push`: it only runs migrations recorded in prisma/migrations, never infers
# destructive changes from the schema, and aborts (non-zero) on any failure so a
# bad deploy stops instead of mutating prod blindly. Prod was baselined on
# 2026-06-27 (the 7 commercialization migrations were marked --applied since
# db push had already applied them out-of-band).
#
# NOTE on the workflow: the migration chain does NOT replay from an empty DB
# (the earliest migrations assume pre-existing tables from the original db-push
# bootstrap), so `migrate dev`/`migrate reset` fail and NEW migrations must be
# authored by hand under prisma/migrations following the existing convention.
# `migrate deploy` applies them fine. A future squash to a single baseline would
# restore from-empty support if a fresh environment is ever needed.
echo "Applying database migrations..."
npx prisma migrate deploy

echo "Database migrations applied successfully!"

# Start the application
echo "Starting application..."
exec node dist/index.js
