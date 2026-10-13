# syntax=docker/dockerfile:1.7
#
# Image du front SafeX (SPA React/Vite). Construite par deploy/vps/docker-compose.yml.
# Étape 1 : `npm run build` (tsc -b strict + vite build), comme le faisait Vercel.
# Étape 2 : Caddy sert dist/ et relaie /hrms/* et /hns/* vers le gateway. La
# configuration (deploy/vps/web/Caddyfile) est montée par le compose, pas copiée.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build
# Variantes .br/.gz servies telles quelles par Caddy (file_server precompressed).
RUN node scripts/precompress-dist.mjs dist

FROM caddy:2-alpine
COPY --from=build /app/dist /srv/www
EXPOSE 80
