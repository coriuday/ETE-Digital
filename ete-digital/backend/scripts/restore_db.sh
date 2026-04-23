#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# restore_db.sh — Restore a pg_dump backup
#
# Usage:
#   export DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
#   bash scripts/restore_db.sh backups/backup_20260421_120000.dump
#
# WARNING: This will DROP and RECREATE the public schema.
#          ALL existing data will be lost. Use only for disaster recovery.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: bash restore_db.sh <backup_file.dump>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ DATABASE_URL is not set. Export it and retry."
    exit 1
fi

echo "⚠️  WARNING: This will overwrite ALL data in the database."
echo "   Backup file: ${BACKUP_FILE}"
echo "   Target DB:   $(echo "$DATABASE_URL" | sed 's|:.*@|:****@|')"
echo ""
read -r -p "Type YES to confirm: " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo "Aborted."
    exit 0
fi

echo "♻️  Restoring from ${BACKUP_FILE}..."

pg_restore \
    --dbname="$DATABASE_URL" \
    --no-acl \
    --no-owner \
    --clean \
    --if-exists \
    --verbose \
    "$BACKUP_FILE"

echo "✅ Restore complete."
echo "   Run 'alembic current' to verify the Alembic version pointer."
