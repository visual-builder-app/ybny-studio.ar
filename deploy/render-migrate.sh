#!/usr/bin/env bash
# Render preDeploy: init extensions + apply database migrations
set -euo pipefail

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable
corepack prepare pnpm@9.14.4 --activate

: "${DATABASE_URL:?DATABASE_URL is required}"

# create extensions schema + uuid-ossp (idempotent)
pnpm --filter=@webstudio-is/prisma-client exec prisma db execute \
  --file ../../../deploy/render-init.sql --url "$DATABASE_URL" || true

# apply pending migrations
pnpm --filter=@webstudio-is/prisma-client migrations migrate
