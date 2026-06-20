# Secret Rotation Checklist — JobsRow / ETE Digital

Use this after any credential exposure (e.g. secrets committed to git) or on a regular rotation schedule.

**WARNING:** Rotating keys invalidates active sessions and may require data migration for encrypted fields.

---

## 1. PostgreSQL database password

```bash
# On VPS as postgres superuser
sudo -u postgres psql -c "ALTER USER ete_user WITH PASSWORD 'NEW_STRONG_PASSWORD';"

# Update DATABASE_URL in backend/.env (and systemd EnvironmentFile if used)
# postgresql+asyncpg://ete_user:NEW_STRONG_PASSWORD@localhost:5432/ete_digital

sudo systemctl restart jobsrow-backend
```

Use least privilege: `ete_user` should **not** be SUPERUSER.

---

## 2. JWT secret (`JWT_SECRET_KEY`)

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

- Update `JWT_SECRET_KEY` in `backend/.env`
- Restart backend — **all users must log in again**
- All outstanding access and refresh tokens become invalid

---

## 3. Field encryption key (`ENCRYPTION_KEY`)

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Impact:** Changing this without migration breaks:
- TOTP secrets stored encrypted on users
- Vault item `file_url` values encrypted at rest

Plan: decrypt with old key and re-encrypt with new key, or disable 2FA / re-upload vault files after rotation.

---

## 4. MinIO / S3 credentials

```bash
# MinIO admin CLI or console — create new access key, update .env:
# MINIO_ACCESS_KEY=...
# MINIO_SECRET_KEY=...
```

Set bucket policy to **private** (no public read). Application uses presigned URLs only.

```bash
# Example: deny public access (adjust alias/bucket)
mc anonymous set none local/ete-digital
```

Restart backend after updating `.env`.

---

## 5. Redis password

```bash
# redis.conf
requirepass YOUR_REDIS_PASSWORD

# .env
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@localhost:6379/0
```

Restart Redis and backend.

---

## 6. Stripe keys

Rotate in [Stripe Dashboard](https://dashboard.stripe.com/apikeys):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (re-create webhook endpoint signing secret)

Update `.env` and restart backend.

---

## 7. Google OAuth

Rotate in Google Cloud Console → Credentials:
- `GOOGLE_CLIENT_SECRET`
- Verify redirect URIs still match `GOOGLE_REDIRECT_URI`

---

## 8. Post-rotation verification

```bash
curl -sf https://jobsrow.com/api/health
curl -sf https://jobsrow.com/api/jobs/search?page=1
# Test login, OAuth, file upload (presigned URL), Stripe webhook in staging first
```

---

## If secrets were in git history

1. Rotate all keys above (assume compromised).
2. Consider `git filter-repo` or BFG to purge history, or treat repo as public.
3. Audit access logs on VPS, Stripe, and database.
