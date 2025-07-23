# DELA×PM統合アプリケーション - Docker設定
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY packages/core/package.json ./packages/core/
COPY apps/unified/package.json ./apps/unified/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build core package first
RUN pnpm --filter @delaxpm/core build

# Build unified app
RUN pnpm --filter @delaxpm/unified build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/unified/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified/.next/static ./apps/unified/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/unified/server.js"]