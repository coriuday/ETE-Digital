# Security Policy

## Supported Versions

The following versions of Jobrows currently receive security updates:

| Version | Supported |
|---------|-----------|
| `main` (latest) | ✅ Active support |
| Older releases | ❌ No longer supported |

We strongly recommend always running the latest version from the `main` branch or the most recent tagged release.

---

## Reporting a Vulnerability

> [!CAUTION]
> **Please do NOT report security vulnerabilities through public GitHub Issues.** Doing so exposes other users to risk before a fix can be released.

### How to Report

Send a **private** disclosure to:

📧 **security@jobrows.com**

If you prefer, you may also use [GitHub's private vulnerability reporting](https://github.com/coriuday/ETE-Digital/security/advisories/new) feature directly on the repository.

Use the subject line format:

```
[SECURITY] <brief description of the vulnerability>
```

### What to Include

To help us triage and reproduce the issue quickly, please provide:

- **Vulnerability type** (e.g., SQL injection, XSS, broken authentication, IDOR)
- **Affected component(s)** — backend endpoint, frontend page, infrastructure
- **Steps to reproduce** — as detailed as possible
- **Proof of concept** — code, payloads, or screenshots (if safe to share)
- **Potential impact** — what an attacker could achieve
- **Suggested fix** (optional, but appreciated)

### Our Response Commitment

| Milestone | Target Time |
|-----------|-------------|
| Initial acknowledgment | Within **48 hours** |
| Triage & severity assessment | Within **5 business days** |
| Status update | Every **7 days** until resolved |
| Patch release | Dependent on severity (see below) |

---

## Severity & Response Times

We use the [CVSS v3.1](https://www.first.org/cvss/) scoring system to classify vulnerabilities:

| Severity | CVSS Score | Target Patch Time |
|----------|-----------|-------------------|
| 🔴 Critical | 9.0 – 10.0 | Within **24–48 hours** |
| 🟠 High | 7.0 – 8.9 | Within **7 days** |
| 🟡 Medium | 4.0 – 6.9 | Within **30 days** |
| 🟢 Low | 0.1 – 3.9 | Next scheduled release |

---

## Disclosure Policy

We follow responsible **Coordinated Vulnerability Disclosure (CVD)**:

1. You report the vulnerability privately to us
2. We acknowledge and investigate
3. We develop and test a fix
4. We release the patch
5. We publicly disclose the vulnerability (typically **90 days** after your report, or sooner once a fix is live)
6. We credit you in the security advisory (unless you prefer to remain anonymous)

---

## Security Features in Jobrows

Jobrows is built with security as a first-class concern across the entire stack:

### Authentication & Authorization
- **Argon2id** password hashing (OWASP recommended)
- **JWT** access + refresh tokens with automatic rotation
- **RBAC** — Role-Based Access Control (candidate, employer, admin)
- Short-lived access tokens (30 minutes default)

### Data Protection
- **Field-level encryption** with Fernet for sensitive PII
- **Encrypted Talent Vault** storage
- Share tokens with configurable expiry and view limits
- GDPR / CCPA compliance-ready data handling

### API Security
- **Rate limiting** via SlowAPI:
  - Login / Register: 5 requests/minute
  - Forgot Password: 3 requests/minute
- **CORS** — configurable allowed origins
- **SQL injection** prevention via SQLAlchemy ORM (parameterized queries)
- **XSS** protection via React's built-in escaping

### Infrastructure
- Docker containers with minimal base images
- Environment variables for all secrets (no hardcoded credentials)
- `.env` files excluded from version control via `.gitignore`
- Deployed on Vercel (frontend), Render (backend), and Supabase (database)

---

## Security Best Practices for Self-Hosting

If you are deploying Jobrows yourself, follow these hardening steps:

### Required Before Going Live

- [ ] Enable **HTTPS** using a valid TLS certificate (e.g., Let's Encrypt)
- [ ] Set a strong `JWT_SECRET_KEY` — use a cryptographically random 32+ character string:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- [ ] Set a strong `ENCRYPTION_KEY` (Fernet key):
  ```bash
  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
  ```
- [ ] Configure `ALLOWED_ORIGINS` to your specific domain — **never use `*` in production**
- [ ] Set `DEBUG=false` in your backend `.env`
- [ ] Use strong, unique passwords for PostgreSQL and Redis

### Recommended

- [ ] Enable and configure **CSP headers** (Content Security Policy)
- [ ] Set up a **Web Application Firewall (WAF)**
- [ ] Run regular **dependency updates** (`pip-audit`, `npm audit`)
- [ ] Perform static analysis scans (`bandit` for Python, `eslint-plugin-security` for JS)
- [ ] Enable **PostgreSQL SSL mode** for database connections
- [ ] Set up **log monitoring and alerting**
- [ ] Schedule regular **automated backups**

---

## Known Security Limitations

- **Tryout payment escrow** is not yet integrated with a regulated payment processor. Do not use in production for real financial transactions until that feature is complete.
- **Email verification** is required — ensure your SMTP configuration is correct before going live.

---

## Security Scanning Tools Used

| Tool | Purpose |
|------|---------|
| [Bandit](https://bandit.readthedocs.io/) | Python static security analysis |
| [Dependabot](https://github.com/dependabot) | Automated dependency vulnerability alerts |
| [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit) | Node.js dependency scanning |
| [Trivy](https://trivy.dev/) | Container & filesystem vulnerability scanning (CI) |
| [Snyk](https://snyk.io/) | Dependency scanning (CI, optional) |

---

## Bug Bounty

We do not currently operate a formal bug bounty program. However, we deeply value the security research community and will:

- **Publicly acknowledge** your contribution in our security advisory (with your permission)
- Provide a **letter of recognition** for significant findings

---

## Contact

| Purpose | Contact |
|---------|---------|
| Security vulnerabilities | [security@jobrows.com](mailto:security@jobrows.com) |
| Code of conduct violations | [conduct@jobrows.com](mailto:conduct@jobrows.com) |
| General support | [support@jobrows.com](mailto:support@jobrows.com) |
| Community discussions | [GitHub Discussions](https://github.com/coriuday/ETE-Digital/discussions) |

---

**Thank you for helping keep Jobrows and its users safe.** 🔐
