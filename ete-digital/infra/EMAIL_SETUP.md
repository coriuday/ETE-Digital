# Email Setup — JobsRow / ETE Digital

Verification emails are **required** when `ENVIRONMENT=production`. Users cannot log in with email/password until `is_verified=true`.

---

## 1. Resend (recommended)

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. Add domain **jobsrow.com** in [Resend → Domains](https://resend.com/domains).
3. Add the DNS records Resend provides (SPF, DKIM) at your DNS host.
4. Wait until domain status is **Verified**.
5. Set in `backend/.env` on the VPS:

```bash
EMAIL_ENABLED=true
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
SMTP_FROM_EMAIL=noreply@jobsrow.com
SMTP_FROM_NAME=Jobrows
FRONTEND_URL=https://jobsrow.com
```

6. Restart backend: `sudo systemctl restart jobsrow-backend`

### Testing before domain verification

Resend sandbox sender (only delivers to addresses you add in Resend dashboard):

```bash
SMTP_FROM_EMAIL=onboarding@resend.dev
```

---

## 2. SMTP fallback

If using Resend SMTP instead of HTTP API:

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USE_TLS=false
SMTP_USER=resend
SMTP_PASSWORD=re_your_api_key
```

---

## 3. Post-deploy smoke test

```bash
# Health
curl -sf https://jobsrow.com/health

# Register test user (use a real inbox you control)
# Then check Resend → Logs for delivery within 60 seconds

# Stuck user: resend from login page or API
curl -X POST https://jobsrow.com/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

---

## 4. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login says "verify inbox" but no email | Resend domain not verified | Verify jobsrow.com in Resend |
| Registration succeeds, no email | `EMAIL_ENABLED=false` or bad API key | Check `.env` and `journalctl -u jobsrow-backend` |
| Email in Resend logs, not inbox | Spam filter | Check spam; improve DKIM/SPF |
| User stuck after failed first send | Old accounts pre-fix | Use **Resend verification** on login page or run `unblock_unverified_users.sh` |

### Check backend logs on VPS

```bash
ssh jobsrow-vps
sudo journalctl -u jobsrow-backend -n 200 --no-pager | grep -iE "resend|email|smtp"
```

### One-time admin unblock (support only)

```bash
sudo -u postgres psql -d ete_digital -c \
  "UPDATE users SET is_verified=true, verification_token=NULL WHERE email='user@example.com';"
```

Or unblock all password-based unverified users:

```bash
sudo bash /path/to/infra/unblock_unverified_users.sh
```

---

## 5. Production checklist

- [ ] `jobsrow.com` verified in Resend
- [ ] `FRONTEND_URL=https://jobsrow.com`
- [ ] `ENVIRONMENT=production` only **after** email works
- [ ] Test register → email arrives → verify link → login works
- [ ] Login page **Resend verification email** button works for stuck users
