FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

COPY . .

# Force regenerate Prisma client with the new schema
RUN npx prisma generate

RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY entrypoint.sh /app/entrypoint.sh

# Normalize line endings and ensure executable permissions
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 3008

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
