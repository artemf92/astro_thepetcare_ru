# ── Astro @astrojs/node (standalone): сборка + Node runtime ─────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.8 --activate

# pnpm-workspace.yaml нужен для lockfile; иначе повторный install в prod-стейдже ломался
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Одна установка на тот же alpine/musl, что и рантайм — без второго frozen --prod install
RUN pnpm prune --prod && rm -rf node_modules/.cache

# ── Production: только node_modules после prune + dist ─────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
# Без этого @astrojs/node слушает только localhost → nginx не достучится
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist

# Счётчики блога: при необходимости монтируйте том на /app/data (см. docker-compose)
RUN mkdir -p /app/data

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
