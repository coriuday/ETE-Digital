# ETE Digital - Development Setup Guide

## Quick Start (10 Minutes)

### Prerequisites Check

Before starting, ensure you have:

- ✅ Python 3.11+ installed
- ✅ Node.js 18+ installed  
- ✅ PostgreSQL 15+ running
- ✅ Redis running (optional for now)

---

## Step 1: Backend Setup (5 min)

### 1.1 Create Virtual Environment

```bash
cd backend
python -m venv venv
```

### 1.2 Activate Virtual Environment

**Windows**:

```bash
venv\Scripts\activate
```

**Mac/Linux**:

```bash
source venv/bin/activate
```

### 1.3 Install Dependencies

```bash
pip install -r requirements.txt
```

**Known Issue**: If `python-email-validator==2.1.0` fails:

```bash
pip install email-validator
```

### 1.4 Setup Environment

```bash
copy .env.example .env
# Edit .env with your settings
```

### 1.5 Initialize Database

**Create Database** (in PostgreSQL):

```sql
CREATE DATABASE ete_digital;
CREATE USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';
GRANT ALL PRIVILEGES ON DATABASE ete_digital TO ete_user;
```

**Run Migrations**:

```bash
alembic upgrade head
```

### 1.6 Start Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

**Verify**: Visit <http://localhost:8000/docs>

---

## Step 2: Frontend Setup (3 min)

### 2.1 Install Dependencies

```bash
cd frontend
npm install
```

### 2.2 Setup Environment

```bash
copy .env.example .env
# Default: VITE_API_URL=http://localhost:8000
```

### 2.3 Start Frontend Server

```bash
npm run dev
```

**Verify**: Visit <http://localhost:5173>

---

## Step 3: Test Integration (2 min)

### 3.1 Register Test User

**Employer**:

1. Go to <http://localhost:5173/register>
2. Select "Employer"
3. Fill form and submit

**Candidate**:

1. Register as "Candidate"

### 3.2 Test Key Flows

**As Employer**:

- [ ] Login
- [ ] Create job posting
- [ ] View jobs list
- [ ] View dashboard

**As Candidate**:

- [ ] Login
- [ ] Browse jobs
- [ ] Apply to job
- [ ] View applications

---

## Troubleshooting

### Backend Issues

**"alembic not recognized"**:

```bash
# Ensure venv is activated
venv\Scripts\activate
pip install alembic
```

**Database connection error**:

```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
```

**Import errors**:

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues

**"Cannot find module"**:

```bash
rm -rf node_modules
npm install
```

**Port 5173 in use**:

```bash
npm run dev -- --port 5174
```

**API connection error**:

- Check backend is running on port 8000
- Verify VITE_API_URL in `.env`

---

## Development Workflow

### Daily Startup

```bash
# Terminal 1: Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 2: Frontend  
cd frontend
npm run dev
```

### Making Changes

**Backend**:

- Edit code → Server auto-reloads
- Add dependencies → `pip install <package>` → Update `requirements.txt`
- Database changes → Create migration → `alembic upgrade head`

**Frontend**:

- Edit code → Hot reload
- Add dependencies → `npm install <package>`

---

## Useful Commands

### Backend

```bash
# Run tests
pytest

# Format code
black .

# Type check
mypy app

# Create migration
alembic revision --autogenerate -m "description"
```

### Frontend

```bash
# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL=postgresql://ete_user:password@localhost:5432/ete_digital
JWT_SECRET_KEY=your-secret-key-min-32-chars
ENCRYPTION_KEY=your-encryption-key-min-32-chars
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## Next Steps

After setup:

1. Review `integration_report.md` for detailed API analysis
2. Test all employer features
3. Test all candidate features
4. Report any bugs found
5. Proceed to Phase 6

---

**Setup Complete!** 🎉
