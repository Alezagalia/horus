# ===========================================
# Horus Web Frontend - Production Dockerfile
# Optimized for Railway deployment
# ===========================================

# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

WORKDIR /app

# Copy workspace files first (better layer caching)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY tsconfig.base.json ./

# Build shared package first
WORKDIR /app/packages/shared
RUN pnpm build

# Build web app
WORKDIR /app/apps/web

# Build argument for API URL (set in Railway)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# ===========================================
# Production stage - Nginx for static files
# ===========================================
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config to conf.d
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Verify files are copied correctly
RUN ls -la /usr/share/nginx/html/assets/ || true

# Railway uses PORT env variable
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
