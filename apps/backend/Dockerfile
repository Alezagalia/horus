# ===========================================
# Horus Backend - Production Dockerfile
# Optimized for Railway deployment
# ===========================================

# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

WORKDIR /app

# Copy workspace files first (better layer caching)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
COPY tsconfig.base.json ./

# Build shared package first (clean build to ensure fresh output)
WORKDIR /app/packages/shared
RUN rm -rf dist && pnpm build

# Generate Prisma Client and build backend
WORKDIR /app/apps/backend
# Set dummy DATABASE_URL for prisma generate (Prisma 7 reads from prisma.config.ts)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate
RUN pnpm build

# ===========================================
# Production stage - minimal image
# ===========================================
FROM node:20-alpine AS runner

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 horus

WORKDIR /app

# Copy workspace structure for pnpm
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy package files
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy prisma.config.ts for Prisma 7 runtime (needed for migrations in prod)
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

# Set ownership to non-root user
RUN chown -R horus:nodejs /app

# Switch to non-root user
USER horus

# Set working directory for the app
WORKDIR /app/apps/backend

# Railway sets PORT automatically
ENV PORT=3000
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
