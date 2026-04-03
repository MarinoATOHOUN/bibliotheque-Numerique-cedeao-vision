#!/bin/sh
set -ex

# On s'assure que le dossier SQLite existe
mkdir -p /data

# On synchronise le schéma Prisma avec la base de données de production
npx prisma db push --accept-data-loss

# Démarrer le backend (qui va aussi servir le frontend)
node dist/index.js
