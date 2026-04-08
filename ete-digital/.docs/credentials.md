# ETE Digital — Credentials Reference

> ⚠️ **Dev/Local only.** Never commit real production secrets.

---

## 🧑‍💻 Test Users

| Role | Email | Password | Name |
|------|-------|----------|------|
| Admin | `admin@etedigital.com` | `Admin@1234` | ETE Admin |
| Employer | `hr@novatech.io` | `Employer@1234` | NovaTech HR |
| Candidate | `arjun.sharma@gmail.com` | `Candidate@1234` | Arjun Sharma |
| Candidate | `priya.nair@gmail.com` | `Candidate@1234` | Priya Nair |

> Recreate users: `python backend/create_users.py` (backend must be running)

---

## 🗄️ Database (PostgreSQL)

| Field | Value |
|-------|-------|
| Host | `localhost:5432` |
| Database | `ete_digital` |
| User | `ete_user` |
| Password | *(set in `.env` → `DATABASE_URL`)* |

---

## 🪣 Object Storage (MinIO)

| Field | Value |
|-------|-------|
| Endpoint | `localhost:9000` |
| Access Key | `minioadmin` |
| Secret Key | `minioadmin123` |
| Bucket | `ete-digital` |
| Console UI | `http://localhost:9001` |

---

## 🌐 Local URLs

| Service | URL |
|---------|-----|
| Frontend | <http://localhost:5173> |
| Backend API | <http://localhost:8000> |
| API Docs (Swagger) | <http://localhost:8000/api/docs> |
| API Docs (ReDoc) | <http://localhost:8000/api/redoc> |

---

## 🔐 Password Policy

All passwords must have: **uppercase + lowercase + digit + special character**, minimum 8 characters.

Example pattern: `Name@1234`
