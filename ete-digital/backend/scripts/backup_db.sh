#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup_db.sh — Create a pg_dump backup before any migration
#
# Usage:
#   export DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
#   bash scripts/backup_db.sh
#
# Output:
#   backups/backup_YYYYMMDD_HHMMSS.dump
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.dump"

if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ DATABASE_URL is not set. Export it and retry."
    exit 1
fi

echo "📦 Creating backup: ${BACKUP_FILE}"

pg_dump \
    "$DATABASE_URL" \
    --format=custom \
    --no-acl \
    --no-owner \
    --verbose \
    -f "$BACKUP_FILE"

echo "✅ Backup complete: ${BACKUP_FILE}"
echo "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
