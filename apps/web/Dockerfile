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

# Production stage - simple Node.js server
FROM node:20-alpine

WORKDIR /app

# Copy built files and server
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/server.js ./

# Create a minimal package.json with ESM support
RUN echo '{"type":"module","dependencies":{"express":"^4.21.0"}}' > package.json

# Install express
RUN npm install

EXPOSE 80
ENV PORT=80
ENV NODE_ENV=production

# Debug: Show contents
RUN ls -la && cat package.json

CMD ["node", "server.js"]
