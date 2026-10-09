#!/usr/bin/env bash
# Backup database PostgreSQL (Supabase) ke file .sql.gz terkompresi.
# Pakai: npm run db:backup
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "Error: .env.local tidak ditemukan" >&2
  exit 1
fi

DATABASE_URL=$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2-)

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL belum diisi di .env.local" >&2
  exit 1
fi

# pg_dump harus >= versi server. Homebrew sering memasang versi lama di PATH,
# jadi utamakan libpq yang biasanya lebih baru.
PG_DUMP=""
for candidate in \
  /usr/local/opt/libpq/bin/pg_dump \
  /opt/homebrew/opt/libpq/bin/pg_dump \
  "$(command -v pg_dump || true)"
do
  if [ -x "$candidate" ]; then PG_DUMP="$candidate"; break; fi
done

if [ -z "$PG_DUMP" ]; then
  echo "Error: pg_dump tidak ditemukan. Pasang dengan: brew install libpq" >&2
  exit 1
fi

OUT="backup_si4care_$(date +%Y%m%d_%H%M%S).sql.gz"

echo "Memakai $("$PG_DUMP" --version)"
"$PG_DUMP" "$DATABASE_URL" --no-owner --no-acl | gzip > "$OUT"

echo "Backup selesai: $OUT ($(du -h "$OUT" | cut -f1))"
