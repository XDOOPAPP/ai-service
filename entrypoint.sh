#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed"
echo "🚀 Starting AI Service..."

exec node dist/main.js
