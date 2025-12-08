# Horus Web Frontend - Production Build
# Version: 3.0.0 - Using http-server with MIME fix

FROM node:20-alpine AS builder

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

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install http-server globally
RUN npm install -g http-server@14.1.1

# Copy built assets
COPY --from=builder /app/apps/web/dist ./dist

# Verify files exist
RUN echo "=== Build contents ===" && ls -la dist/ && ls -la dist/assets/ | head -20

ENV NODE_ENV=production

# Start http-server with:
# -p: port from env
# --proxy: fallback for SPA routing
# -c-1: disable caching
# --mimetypes: force correct JS MIME type
CMD ["sh", "-c", "http-server dist -p ${PORT:-80} --proxy http://localhost:${PORT:-80}? -c-1 --mimetypes '{\"application/javascript\":[\"js\",\"mjs\"]}'"]
