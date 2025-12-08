# ===========================================
# Horus Web Frontend - Production Dockerfile
# Using Node.js serve instead of nginx to avoid MIME type issues
# ===========================================

FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY tsconfig.base.json ./

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm build

# Build web app
WORKDIR /app/apps/web

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# ===========================================
# Production stage - Node.js serve
# ===========================================
FROM node:20-alpine AS runner

# Install serve globally
RUN npm install -g serve@14

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 horus

WORKDIR /app

# Copy built static files
COPY --from=builder /app/apps/web/dist ./dist

# Change ownership
RUN chown -R horus:nodejs /app

USER horus

EXPOSE 80

# Serve static files with SPA fallback on port 80
CMD ["serve", "-s", "dist", "-l", "80"]
