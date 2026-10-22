# estágio de build: dependências de desenvolvimento, client do prisma e compilação do typescript.
# também é usado pelo serviço "seed" do compose (precisa do tsx e do código-fonte)
FROM node:22-alpine AS build

# openssl é exigido pelo engine do prisma no alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# estágio final: só dependências de produção e o js compilado
FROM node:22-alpine AS runtime

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/health || exit 1

# aplica as migrations e sobe a API (o seed é manual: docker compose --profile seed run --rm seed)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
