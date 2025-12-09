# ===========================================
# Horus Unified Dockerfile
# Backend + Frontend in a single container
# ===========================================

# ===========================================
# Stage 1: Build Frontend
# ===========================================
FROM node:20-alpine AS frontend-builder

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY tsconfig.base.json ./

WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/apps/web
# For unified deploy, API is on same origin (empty = relative URLs)
ENV VITE_API_URL=""
RUN pnpm build

# ===========================================
# Stage 2: Build Backend
# ===========================================
FROM node:20-alpine AS backend-builder

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
COPY tsconfig.base.json ./

WORKDIR /app/packages/shared
RUN rm -rf dist && pnpm build

WORKDIR /app/apps/backend
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate
RUN pnpm build

# ===========================================
# Stage 3: Production
# ===========================================
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 horus

WORKDIR /app

# Copy workspace structure
COPY --from=backend-builder /app/pnpm-workspace.yaml ./
COPY --from=backend-builder /app/package.json ./
COPY --from=backend-builder /app/pnpm-lock.yaml ./
COPY --from=backend-builder /app/apps/backend/package.json ./apps/backend/
COPY --from=backend-builder /app/packages/shared/package.json ./packages/shared/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built backend
COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-builder /app/packages/shared/dist ./packages/shared/dist

# Copy Prisma files (schema + migrations + config)
COPY --from=backend-builder /app/apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.js ./apps/backend/prisma.config.js

# Copy entrypoint script and convert to Unix line endings
COPY apps/backend/docker-entrypoint.sh ./apps/backend/docker-entrypoint.sh
RUN sed -i 's/\r$//' ./apps/backend/docker-entrypoint.sh

# Copy frontend build to backend's public folder
COPY --from=frontend-builder /app/apps/web/dist ./apps/backend/dist/public

# Verify frontend files
RUN echo "=== Frontend files ===" && ls -la ./apps/backend/dist/public/ && ls -la ./apps/backend/dist/public/assets/ | head -10

# Make entrypoint executable and set ownership
RUN chmod +x ./apps/backend/docker-entrypoint.sh && \
    chown -R horus:nodejs /app

USER horus

WORKDIR /app/apps/backend

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Use entrypoint to run migrations before starting app
ENTRYPOINT ["./docker-entrypoint.sh"]
