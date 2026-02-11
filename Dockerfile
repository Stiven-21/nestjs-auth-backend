# -----------------------------
# 🏗 Stage 1: Builder
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

# Instalamos todas las deps (incluye dev)
RUN pnpm install --frozen-lockfile --config.node-linker=hoisted

COPY . .

# Build oficial
RUN pnpm run build


# -----------------------------
# 🚀 Stage 2: Production
# -----------------------------
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

# Solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile --ignore-scripts --config.node-linker=hoisted

# Copiamos SOLO lo necesario desde builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/src/i18n ./src/i18n

EXPOSE 3000

CMD ["node", "dist/main.js"]
