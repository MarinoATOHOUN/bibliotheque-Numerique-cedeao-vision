FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build du Frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Build du Backend
WORKDIR /app/server
RUN npm install
RUN npx prisma generate
RUN npx tsc

# 3. Image de Production
FROM node:20-alpine
WORKDIR /app

# Installer openssl pour Prisma
RUN apk add --no-cache openssl

# Copier les dépendances backend depuis le builder
COPY --from=builder /app/server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copier Prisma et générer le client de production
COPY --from=builder /app/server/prisma ./prisma
# On génère le client ici pour être sûr qu'il lie le binaire de production
RUN npx prisma generate

# Copier le code compilé backend
COPY --from=builder /app/server/dist ./dist

# Copier le build frontend
COPY --from=builder /app/dist /app/dist

# Script de démarrage
COPY --from=builder /app/server/start.sh ./start.sh
RUN chmod +x ./start.sh

# Variables d'environnement pour la production
ENV NODE_ENV=production
ENV PORT=8080
ENV STORAGE_PATH=/data
ENV DATABASE_URL="file:/data/dev.db"

EXPOSE 8080

CMD ["./start.sh"]
