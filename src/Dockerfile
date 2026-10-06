FROM node:24-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY tests/serve.ts ./tests/serve.ts

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3001
CMD ["npx", "tsx", "tests/serve.ts"]
