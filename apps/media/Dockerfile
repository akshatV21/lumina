FROM node:22-slim AS development

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY /package*.json .
RUN npm install

COPY /apps ./apps
COPY /libs ./libs
COPY /prisma ./prisma
COPY /tsconfig*.json .
COPY /nest-cli.json .

RUN npm run db:generate
RUN npm run build media

FROM node:22-slim AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY /package*.json .
RUN npm ci --only=production

COPY --from=development /app/dist ./dist
COPY --from=development /app/generated ./generated

CMD ["node", "dist/apps/media/main"]