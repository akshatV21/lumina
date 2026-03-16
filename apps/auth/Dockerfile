FROM node:22-slim AS development

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ffmpeg && rm -rf /var/lib/apt/lists/*

COPY /package*.json .
RUN npm install

RUN npm install --os=linux --cpu=x64 sharp

COPY /apps ./apps
COPY /libs ./libs
COPY /prisma ./prisma
COPY /tsconfig*.json .
COPY /nest-cli.json .

RUN npm run db:generate
RUN npm run build auth

FROM node:22-slim AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ffmpeg && rm -rf /var/lib/apt/lists/*

COPY /package*.json .
RUN npm ci --only=production

RUN npm install --os=linux --cpu=x64 sharp

COPY --from=development /app/dist ./dist
COPY --from=development /app/generated ./generated

CMD ["node", "dist/apps/auth/main"]