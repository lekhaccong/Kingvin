FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY . .

ARG VITE_AUTH_ENABLED=true
ARG VITE_GROK_OAUTH_ENABLED=false
ENV VITE_AUTH_ENABLED=$VITE_AUTH_ENABLED
ENV VITE_GROK_OAUTH_ENABLED=$VITE_GROK_OAUTH_ENABLED
ENV NITRO_PRESET=node_server
RUN npm run build:selfhost

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8081
WORKDIR /app

RUN groupadd --system kingvin && useradd --system --gid kingvin kingvin
COPY --from=build --chown=kingvin:kingvin /app/.output ./.output
USER kingvin

EXPOSE 8081
CMD ["node", ".output/server/index.mjs"]
