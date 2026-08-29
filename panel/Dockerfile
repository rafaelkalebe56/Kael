FROM node:22 AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . ./
RUN pnpm build

FROM node:22

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
RUN chown -R node:node /app

USER node
EXPOSE 8080
CMD ["sh", "-c", "node node_modules/wrangler/bin/wrangler.js dev --local --config dist/server/wrangler.json --ip 0.0.0.0 --port ${PORT:-8080}"]
