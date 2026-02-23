FROM oven/bun:1.1.38 AS build
WORKDIR /app

COPY bun.lock package.json astro.config.mjs tailwind.config.mjs tsconfig.json ./
COPY public ./public
COPY src ./src

RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1.1.38-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/dist /dist

EXPOSE 3000
CMD ["bunx", "serve", "/dist", "-p", "3000"]
