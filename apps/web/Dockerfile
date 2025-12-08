# Build stage
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

# Production stage - use serve for proper MIME types
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve@14

# Copy built files
COPY --from=builder /app/apps/web/dist ./dist

ENV NODE_ENV=production

# Debug: Show contents and verify serve is installed
RUN ls -la dist/ && ls -la dist/assets/ && which serve

# Use serve with SPA mode - listen on PORT env var (Railway sets this)
CMD serve -s dist -l tcp://0.0.0.0:${PORT:-80}
