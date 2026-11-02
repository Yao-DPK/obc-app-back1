# ============================================================
# STAGE 1 – Base
# ============================================================
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# ============================================================
# STAGE 2 – Dependencies (cache des dépendances)
# ============================================================
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
#COPY packages/database/package.json ./packages/database/
#COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install

# ============================================================
# STAGE 3 – Builder (build de l'API)
# ============================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
# COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules

# Copier le code source
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/api ./apps/api
COPY packages ./packages

# Build
RUN pnpm --filter @obc-app/api build

# ============================================================
# STAGE 4 – Runner (image finale, légère)
# ============================================================
FROM node:22-alpine AS runner
WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copier uniquement le nécessaire
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

USER nestjs

EXPOSE 3031

ENV NODE_ENV=production
ENV PORT=3031

CMD ["node", "dist/src/main.js"]
