FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/

RUN npm ci && npm --prefix backend ci

COPY . .

RUN npm --prefix backend run build \
  && npm --prefix backend prune --omit=dev \
  && mkdir -p /app/backend/uploads \
  && chmod +x /app/docker/start.sh

ENV PORT=4050
ENV WEB_PORT=4059
ENV API_PROXY_TARGET=http://127.0.0.1:4050

EXPOSE 4059
EXPOSE 4050

CMD ["/app/docker/start.sh"]
