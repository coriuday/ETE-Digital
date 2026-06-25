#!/usr/bin/env bash
# Support script: verify email/password users stuck without verification.
# OAuth-only users (password_hash=OAUTH_NO_PASSWORD) are skipped.
# Usage: sudo bash unblock_unverified_users.sh [--yes]
set -euo pipefail

AUTO="${1:-}"

echo "=== Unverified email/password users (before) ==="
sudo -u postgres psql -d ete_digital -c \
  "SELECT email, created_at::date FROM users WHERE is_verified=false AND password_hash != 'OAUTH_NO_PASSWORD' ORDER BY created_at;"

if [[ "${AUTO}" != "--yes" ]]; then
  read -r -p "Set is_verified=true for ALL users above? [y/N] " confirm
  if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

sudo -u postgres psql -d ete_digital -c \
  "UPDATE users SET is_verified=true, verification_token=NULL, verification_token_expires=NULL
   WHERE is_verified=false AND password_hash != 'OAUTH_NO_PASSWORD';"

echo "=== Done. Affected users can log in without email verification. ==="
