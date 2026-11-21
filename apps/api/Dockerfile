FROM node:20-slim AS dev

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    python3 \
    build-essential \
    ca-certificates \
    curl \
    tzdata \
    && ln -fs /usr/share/zoneinfo/Asia/Jakarta /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Jakarta

ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=10000 \
    NPM_CONFIG_LOGLEVEL=warn

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/
COPY prisma.config.js ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
