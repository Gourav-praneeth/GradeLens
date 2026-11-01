#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL must contain the pooled PostgreSQL connection string}"
: "${DATABASE_URL_UNPOOLED:?DATABASE_URL_UNPOOLED must contain the direct PostgreSQL connection string}"
: "${LLM_KEY_SECRET:?LLM_KEY_SECRET is required in production}"
export STORAGE_DRIVER="${STORAGE_DRIVER:-s3}"

if [ "$STORAGE_DRIVER" = "s3" ]; then
  : "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required when STORAGE_DRIVER=s3}"
  : "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required when STORAGE_DRIVER=s3}"
fi

npx prisma migrate deploy
exec node server.js
