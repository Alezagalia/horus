# ===========================================
# Horus - Multi-service Dockerfile
# Set BUILD_TARGET=frontend or BUILD_TARGET=backend
# ===========================================

ARG BUILD_TARGET=backend

# ===========================================
# Frontend Build
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

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# Frontend production stage
FROM nginx:alpine AS frontend

# Copy built static files
COPY --from=frontend-builder /app/apps/web/dist /usr/share/nginx/html

# Replace default nginx config completely (not conf.d, the main config)
RUN cat > /etc/nginx/nginx.conf << 'NGINXEOF'
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml application/javascript application/json image/svg+xml;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
NGINXEOF

# Remove conf.d configs to avoid conflicts
RUN rm -rf /etc/nginx/conf.d/*

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ===========================================
# Backend Build
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
RUN npx prisma generate
RUN pnpm build

# Backend production stage
FROM node:20-alpine AS backend

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 horus

WORKDIR /app

COPY --from=backend-builder /app/pnpm-workspace.yaml ./
COPY --from=backend-builder /app/package.json ./
COPY --from=backend-builder /app/pnpm-lock.yaml ./
COPY --from=backend-builder /app/apps/backend/package.json ./apps/backend/
COPY --from=backend-builder /app/packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=backend-builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=backend-builder /app/apps/backend/src/generated ./apps/backend/src/generated

RUN chown -R horus:nodejs /app

WORKDIR /app/apps/backend
USER horus

EXPOSE 3000
CMD ["node", "dist/index.js"]

# ===========================================
# Final stage - select based on BUILD_TARGET
# ===========================================
FROM ${BUILD_TARGET} AS final
