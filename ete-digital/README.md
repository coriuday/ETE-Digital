# ETE Digital - Open-Source Job & Talent Platform

> **Outcome-driven hiring meets verifiable skill signals**

ETE Digital is a production-grade, open-source job platform that revolutionizes hiring through **Job Tryouts** (trial tasks), a candidate-owned **Talent Vault**, and **explainable matching**. Built with modern technology and security-first principles.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)

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
- Verified samples auto-populate talent vault

### 🏆 Talent Vault

- Candidate-owned portfolio system
- **Encrypted storage** for sensitive work samples
- Granular sharing with expiry & view limits
- Auto-verified items from passed tryouts

### 🔍 Explainable Matching

- Skill-based scoring with transparency
- Full-text search across jobs
- Filter by: type, location, salary, skills, remote

### 🔐 Security First

- Argon2 password hashing
- JWT authentication with token rotation
- Field-level encryption (Fernet)
- RBAC (Role-Based Access Control)
- GDPR/CCPA compliance ready

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### 1. Clone Repository

```bash
git clone https://github.com/coriuday/ETE-Digital
cd ete-digital
```

### 2. Setup Environment

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your settings
```

### 3. Start Development Stack

```bash
cd infra/docker
docker-compose up -d
```

Services will be available at:

- **Frontend:** <http://localhost:5173>
- **Backend API:** <http://localhost:8000>
- **API Docs:** <http://localhost:8000/api/docs>
- **MinIO Console:** <http://localhost:9001>
- **MailHog:** <http://localhost:8025>

### 4. Initialize Database

```bash
docker exec ete-backend alembic upgrade head
```

---

## 📚 Tech Stack

### Backend

- **Framework:** FastAPI (async Python)
- **Database:** PostgreSQL 15 (with asyncpg)
- **Cache:** Redis 7
- **Storage:** MinIO (S3-compatible)
- **Email:** SMTP (MailHog for dev)
- **ORM:** SQLAlchemy (async)
- **Migrations:** Alembic

### Frontend

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3.4
- **State:** Zustand + React Query
- **Routing:** React Router v6

### Infrastructure

- **Container:** Docker + Docker Compose
- **Orchestration:** Kubernetes (ready)
- **IaC:** Terraform templates
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
  "company": "Tech Corp",
  "description": "...",
  "requirements": "...",
  "job_type": "full_time",
  "remote_ok": true,
  "salary_min": 100000,
  "salary_max": 150000,
  "skills_required": ["Python", "FastAPI", "React"]
}

# Apply to job (candidate)
POST /api/jobs/{job_id}/apply
Authorization: Bearer <token>
{
  "cover_letter": "...",
  "vault_share_token": "optional-token"
}
```

### Tryouts

```bash
# Create tryout (employer)
POST /api/tryouts
{
  "job_id": "...",
  "title": "Build a REST API",
  "description": "...",
  "estimated_duration_hours": 4,
  "payment_amount": 5000,
  "scoring_rubric": {
    "code_quality": 40,
    "functionality": 40,
    "tests": 20
  },
  "passing_score": 70
}

# Submit solution (candidate)
POST /api/tryouts/{id}/submit
{
  "submission_url": "https://github.com/user/project",
  "notes": "Implemented all requirements"
}
```

### Talent Vault

```bash
# Add item to vault (candidate)
POST /api/vault/items
{
  "type": "project",
  "title": "E-commerce Platform",
  "description": "...",
  "file_url": "https://github.com/user/project",
  "metadata": {
    "tech_stack": ["React", "Node.js"],
    "live_url": "https://demo.com"
  }
}

# Create share token
POST /api/vault/share
{
  "vault_item_ids": ["..."],
  "expires_hours": 48,
  "max_views": 10,
  "shared_with_company": "Tech Corp"
}

# Access via token (public)
GET /api/vault/shared/{token}
```

**Full API Documentation:** <http://localhost:8000/api/docs> (when running)

---

## 🔧 Development

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Run Tests

```bash
# Backend
cd backend
pytest tests/ --cov=app

# Frontend
cd frontend
npm run test
```

### Database Migrations

```bash
# Create migration
cd backend
alembic revision --autogenerate -m "Add new field"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 🏗️ Project Structure

```
ete-digital/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── core/      # Config, security, database
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── main.py    # FastAPI app
│   ├── alembic/       # Database migrations
│   ├── tests/         # Backend tests
│   └── requirements.txt
├── frontend/          # Vite + React frontend
│   ├── src/
│   │   ├── api/       # API client
│   │   ├── components/# React components
│   │   ├── pages/     # Page components
│   │   ├── stores/    # Zustand stores
│   │   └── styles/    # CSS & Tailwind
│   └── package.json
├── infra/             # Infrastructure
│   ├── docker/        # Docker Compose
│   ├── k8s/           # Kubernetes manifests
│   └── terraform/     # IaC templates
├── docs/              # Documentation
└── README.md
```

---

## 🔒 Security

### Built-in Security Features

- ✅ **Password Hashing:** Argon2id (OWASP recommended)
- ✅ **Authentication:** JWT with access + refresh tokens
- ✅ **Token Rotation:** Automatic refresh token rotation
- ✅ **Field Encryption:** Fernet encryption for PII
- ✅ **RBAC:** Role-based access control
- ✅ **Rate Limiting:** SlowAPI — auth endpoints (5 req/min login/register, 3/min forgot-password)
- ✅ **CORS:** Configurable origins
- ✅ **SQL Injection:** Prevented (SQLAlchemy ORM)
- ✅ **XSS:** React's built-in protection

### Security Checklist

- [x] Enable HTTPS in production (use Let's Encrypt)
- [x] Set strong `JWT_SECRET_KEY` (32+ random chars)
- [x] Set `ENCRYPTION_KEY` (Fernet.generate_key())
- [x] Configure CSP headers
- [x] Enable rate limiting
- [x] Regular dependency updates
- [x] Security scanning (Snyk, Bandit)

---

## 📈 Scalability

### Architecture Decisions

- **Async Everything:** FastAPI + asyncpg for high concurrency
- **Connection Pooling:** 20 connections with 10 overflow
- **Caching:** Redis for sessions and hot data
- **Stateless API:** Ready for horizontal scaling
- **JSONB Fields:** Flexible schema for evolving requirements

---

## 🤝 Contributing

We welcome contributions! Please see [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Workflow

- Follow PEP 8 (Python) and Airbnb style guide (JavaScript)
- Write tests for new features
- Update documentation
- Ensure CI passes

---

## 📄 License

This project is licensed under the **MIT License** - see [`LICENSE`](LICENSE) file for details.
x---

## 🙏 Acknowledgments

Built with:

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vite](https://vitejs.dev/) - Next-gen frontend tooling
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL toolkit

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/coriuday/ETE-Digital/issues)
- **Discussions:** [GitHub Discussions](https://github.com/coriuday/ETE-Digital/discussions)

---

**Built with ❤️ by [@ashuisalluneed](https://github.com/ashuisalluneed) & [@coriuday](https://github.com/coriuday)**
