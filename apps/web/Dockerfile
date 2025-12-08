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

# Production stage - Node.js with http-server (simpler than express)
FROM node:20-alpine

WORKDIR /app

RUN npm install -g http-server@14

COPY --from=builder /app/apps/web/dist ./dist

ENV NODE_ENV=production

# http-server with proper MIME types, SPA mode, and dynamic port
CMD sh -c "http-server dist -p \${PORT:-80} --proxy http://localhost:\${PORT:-80}? -c-1 --mime-types '{\"js\":\"application/javascript\",\"mjs\":\"application/javascript\"}'"
