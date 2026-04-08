# Jobrows — Open-Source Job & Talent Platform

> **Outcome-driven hiring meets verifiable skill signals**

Jobrows is a production-grade, open-source job platform that revolutionizes hiring through **Job Tryouts** (trial tasks), a candidate-owned **Talent Vault**, and **explainable matching**. Built with a modern, security-first stack and deployed on Vercel + Render + Supabase.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![CI](https://github.com/coriuday/ETE-Digital/actions/workflows/ci.yml/badge.svg)](https://github.com/coriuday/ETE-Digital/actions/workflows/ci.yml)

---

## 👥 Contributors

| Contributor | GitHub | Role |
|-------------|--------|------|
| **Ashish Kumar** | [@ashuisalluneed](https://github.com/ashuisalluneed) | Gen AI Frontend Dev |
| **Uday Kumar Kori** | [@coriuday](https://github.com/coriuday) | Gen AI Fullstack Dev |

---

## ✨ Key Features

### 🎯 Job Tryouts

- Employers create **trial tasks** with auto-grading rubrics
- Candidates complete real work samples instead of traditional interviews
- Payment escrow ensures fairness
- Verified samples auto-populate the Talent Vault

### 🏆 Talent Vault

- Candidate-owned portfolio system
- **Encrypted storage** for sensitive work samples
- Granular sharing with expiry & view limits
- Auto-verified items from passed tryouts

### 🔍 Explainable Matching

- Skill-based scoring with full transparency
- Full-text search across all job listings
- Filter by: type, location, salary, skills, remote

### 🔐 Security First

- Argon2id password hashing
- JWT authentication with token rotation
- Field-level encryption (Fernet)
- RBAC (Role-Based Access Control)
- GDPR / CCPA compliance-ready

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### 1. Clone Repository

```bash
git clone https://github.com/coriuday/ETE-Digital.git
cd ETE-Digital/ete-digital
```

### 2. Setup Environment

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the .env files with your settings
```

### 3. Start Development Stack

```bash
cd infra/docker
docker-compose up -d
```

Services will be available at:

- **Frontend:** <http://localhost:5173>
- **Backend API:** <http://localhost:8000>
- **API Docs (Swagger):** <http://localhost:8000/api/docs>
- **API Docs (ReDoc):** <http://localhost:8000/api/redoc>
- **MinIO Console:** <http://localhost:9001>

### 4. Initialize Database

```bash
docker exec ete-backend alembic upgrade head
```

---

## 📚 Tech Stack

### Backend

- **Framework:** FastAPI (async Python)
- **Database:** PostgreSQL via Supabase
- **Cache:** Redis 7
- **Storage:** MinIO (S3-compatible)
- **ORM:** SQLAlchemy (async) + Alembic migrations

### Frontend

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3.4
- **State:** Zustand + React Query
- **Routing:** React Router v6

### Infrastructure

- **Hosting:** Vercel (frontend) + Render (backend)
- **Database:** Supabase (PostgreSQL)
- **Container:** Docker + Docker Compose
- **CI/CD:** GitHub Actions

---

## 📖 API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "candidate",
  "full_name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Jobs

```bash
# Search jobs
GET /api/jobs/search?query=developer&remote_ok=true&page=1

# Create job (employer)
POST /api/jobs
Authorization: Bearer <token>
{
  "title": "Senior Developer",
  "description": "...",
  "job_type": "full_time",
  "remote_ok": true,
  "salary_min": 500000,
  "salary_max": 1500000,
  "skills_required": ["Python", "FastAPI", "React"]
}
```

### Tryouts

```bash
# Create tryout (employer)
POST /api/tryouts
{
  "job_id": "...",
  "title": "Build a REST API",
  "estimated_duration_hours": 4,
  "payment_amount": 5000,
  "scoring_rubric": { "code_quality": 40, "functionality": 40, "tests": 20 },
  "passing_score": 70
}

# Submit solution (candidate)
POST /api/tryouts/{id}/submit
{
  "submission_url": "https://github.com/user/project",
  "notes": "Implemented all requirements"
}
```

**Full API Docs:** <http://localhost:8000/api/docs> (when running locally)

---

## 🔧 Development

### Backend

```bash
cd ete-digital/backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd ete-digital/frontend
npm install
npm run dev
```

### Run Tests

```bash
# Backend
cd ete-digital/backend
pytest tests/ --cov=app

# Frontend
cd ete-digital/frontend
npm run test
```

---

## 🏗️ Project Structure

```
ETE-Digital/
├── .github/workflows/     # CI/CD pipelines (GitHub Actions)
├── ete-digital/
│   ├── backend/           # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/       # API route handlers
│   │   │   ├── core/      # Config, security, database
│   │   │   ├── models/    # SQLAlchemy models
│   │   │   ├── schemas/   # Pydantic schemas
│   │   │   ├── services/  # Business logic
│   │   │   └── main.py    # FastAPI entry point
│   │   ├── alembic/       # Database migrations
│   │   └── tests/         # Backend test suite
│   ├── frontend/          # Vite + React frontend
│   │   └── src/
│   │       ├── api/       # API client layer
│   │       ├── components/# Reusable components
│   │       ├── pages/     # Page components
│   │       └── stores/    # Zustand state stores
│   ├── infra/             # Docker, Kubernetes, Terraform
│   └── supabase/          # Database migrations & config
└── render.yaml            # Render deployment config
```

---

## 🔒 Security

- ✅ **Password Hashing:** Argon2id (OWASP recommended)
- ✅ **Authentication:** JWT with access + refresh tokens
- ✅ **Token Rotation:** Automatic refresh token rotation
- ✅ **Field Encryption:** Fernet encryption for PII
- ✅ **RBAC:** Role-based access control (candidate / employer / admin)
- ✅ **Rate Limiting:** SlowAPI — 5 req/min login, 3 req/min forgot-password
- ✅ **CORS:** Configurable allowed origins
- ✅ **SQL Injection:** Prevented via SQLAlchemy ORM
- ✅ **XSS:** React's built-in escaping

---

## 🤝 Contributing

We welcome contributions! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) for community standards.

---

## 📄 License

This project is licensed under the **MIT License** — see the [`LICENSE`](LICENSE) file for details.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/coriuday/ETE-Digital/issues)
- **Discussions:** [GitHub Discussions](https://github.com/coriuday/ETE-Digital/discussions)
- **Email:** [support@jobrows.com](mailto:support@jobrows.com)

---

**Built with ❤️ by [@ashuisalluneed](https://github.com/ashuisalluneed) & [@coriuday](https://github.com/coriuday)**
