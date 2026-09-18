#!/usr/bin/env bash
# Render build: install deps + build the Webstudio builder (arabic)
set -euo pipefail

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable
corepack prepare pnpm@9.14.4 --activate

pnpm install --frozen-lockfile

# generate prisma client (needed by builder server code)
pnpm --filter=@webstudio-is/prisma-client generate

# build the builder app (prebuild builds required workspace deps)
pnpm --filter=@webstudio-is/builder build
