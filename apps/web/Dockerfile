# Horus Web Frontend - Production Build
# Version: 4.0.0 - Using Python http.server (guaranteed MIME types)

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
# Production Stage - Nginx with dynamic PORT
# ============================================
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Create nginx config template (uses $PORT env var)
RUN echo 'server { \
    listen ${PORT}; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    types { \
        application/javascript js mjs; \
        text/css css; \
        text/html html htm; \
        application/json json; \
        image/svg+xml svg svgz; \
        image/png png; \
        image/jpeg jpg jpeg; \
        image/gif gif; \
        image/x-icon ico; \
        font/woff woff; \
        font/woff2 woff2; \
        application/manifest+json webmanifest; \
    } \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/templates/default.conf.template

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Verify files exist
RUN echo "=== Build contents ===" && ls -la /usr/share/nginx/html/ && ls -la /usr/share/nginx/html/assets/ | head -10

# Default port (Railway will override with $PORT)
ENV PORT=80

CMD ["nginx", "-g", "daemon off;"]
