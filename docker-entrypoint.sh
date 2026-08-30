#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR/uploads"

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:${DATA_DIR}/gradelens.db"
fi
if [ -z "${UPLOAD_DIR:-}" ]; then
  export UPLOAD_DIR="${DATA_DIR}/uploads"
fi

npx prisma migrate deploy
exec node server.js
