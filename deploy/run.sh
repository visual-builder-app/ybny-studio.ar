#!/bin/bash
# نقطة تشغيل Webstudio المعرَّب على Render (خطة مجانية)
# الترتيب: تهيئة القاعدة → ترحيلات Prisma → PostgREST → خادم Remix
set -euo pipefail

cd "$(dirname "$0")"
ROOT="$PWD"

: "${DATABASE_URL:?DATABASE_URL is required}"
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"
export PGRST_DB_ANON_ROLE="${PGRST_DB_ANON_ROLE:-webstudio}"

echo "[run] 1/4 تهيئة الإضافات (extensions)..."
(cd migrations && ./node_modules/.bin/prisma db execute --file ../render-init.sql --url "$DATABASE_URL") || echo "[run] تحذير: تهيئة الإضافات فشلت (ربما موجودة مسبقاً)"

echo "[run] 2/4 تطبيق ترحيلات قاعدة البيانات..."
(cd migrations && PATH="$PWD/node_modules/.bin:$PATH" ./node_modules/.bin/tsx migrations-cli/cli.ts migrate)

echo "[run] 3/4 تشغيل PostgREST..."
PGRST_DB_URI="$DATABASE_URL" \
PGRST_DB_SCHEMAS=public \
PGRST_DB_ANON_ROLE="$PGRST_DB_ANON_ROLE" \
PGRST_SERVER_PORT=3000 \
"$ROOT/postgrest" &
PGRST_PID=$!

for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:3000/ > /dev/null 2>&1; then
    echo "[run] PostgREST جاهز"
    break
  fi
  if ! kill -0 "$PGRST_PID" 2>/dev/null; then
    echo "[run] خطأ: PostgREST توقف" >&2
    exit 1
  fi
  sleep 1
done

echo "[run] 4/4 تشغيل الاستوديو (remix-serve)..."
cd "$ROOT/builder"
exec ./node_modules/.bin/remix-serve build/server/index.js
