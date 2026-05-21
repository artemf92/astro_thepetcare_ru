# ── Astro @astrojs/node (standalone): сборка + Node runtime ─────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.8 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ── Production: только прод-зависимости (sharp, astro runtime и т.д.) ───────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
# Без этого @astrojs/node слушает только localhost → nginx не достучится
ENV HOST=0.0.0.0
ENV PORT=4321

RUN corepack enable && corepack prepare pnpm@11.0.8 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

# Счётчики блога: при необходимости монтируйте том на /app/data (см. docker-compose)
RUN mkdir -p /app/data

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
