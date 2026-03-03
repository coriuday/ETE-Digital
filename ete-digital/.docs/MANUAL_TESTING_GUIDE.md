# Manual Testing Guide - Step by Step

## Prerequisites Check

Before you start, verify:

- ✅ PostgreSQL is running
- ✅ PostgreSQL password is: `root`
- ✅ Backend virtual environment exists

---

## Step 1: Start Backend (Terminal 1)

Open a new terminal and run:

```bash
# Navigate to backend
cd d:\ALL projects\ind\ete-digital\backend

# Activate virtual environment
venv\Scripts\activate

# Run database migrations (one-time setup)
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload
```

**Expected Output**:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Test it**: Open <http://localhost:8000/docs> in your browser

---

## Step 2: Start Frontend (Terminal 2)

Open a **NEW** terminal and run:

```bash
# Navigate to frontend
cd d:\ALL projects\ind\ete-digital\frontend

# Start frontend server
npm run dev
```

**Expected Output**:

```
VITE v5.4.21  ready in XXX ms

➜  Local:   http://localhost:5173/
```

**Test it**: Open <http://localhost:5173> in your browser

---

## Step 3: Test the Application

### A. Test Backend API

1. **Open API Docs**: <http://localhost:8000/docs>
2. **Try Health Endpoint**:
   - Click on `/health`
   - Click "Try it out"
   - Click "Execute"
   - Should return `{"status": "healthy"}`

### B. Test Frontend

1. **Open App**: <http://localhost:5173>
2. **Check Console**: Press F12, check for errors
3. **Test Navigation**: Click around the UI

### C. Test Integration

1. **Register a New User**:
   - Go to registration page
   - Fill in details
   - Submit

2. **Check Database**:

   ```bash
   psql -U postgres -d ete_digital
   # Password: root
   
   SELECT * FROM users;
   \q
   ```

---

## Stopping the Servers

### Stop Backend

- Go to Terminal 1 (backend)
- Press `Ctrl + C`

### Stop Frontend  

- Go to Terminal 2 (frontend)
- Press `Ctrl + C`

---

## Quick Restart Commands

### Backend Only

```bash
cd d:\ALL projects\ind\ete-digital\backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

### Frontend Only

```bash
cd d:\ALL projects\ind\ete-digital\frontend
npm run dev
```

### Both Servers

Open 2 terminals and run the commands above in each.

---

## Troubleshooting

### Backend won't start

```bash
# Check if Python packages are installed
cd d:\ALL projects\ind\ete-digital\backend
venv\Scripts\activate
pip list | findstr -i "fastapi uvicorn alembic"

# If missing, install:
pip install fastapi uvicorn[standard] sqlalchemy alembic asyncpg psycopg2-binary
```

### Frontend won't start

```bash
# Check if node_modules exists
cd d:\ALL projects\ind\ete-digital\frontend
npm install
```

### Database connection fails

```bash
# Test PostgreSQL connection
psql -U postgres
# Password: root

# If fails, PostgreSQL might not be running
# Open Services (Win+R → services.msc)
# Find postgresql-x64-XX → Start
```

### Port already in use

**Backend (port 8000)**:

```bash
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Frontend (port 5173)**:

```bash
# Find and kill process  
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## PostgreSQL Credentials (For Reference)

| Item | Value |
|------|-------|
| Superuser | `postgres` |
| Password | `root` |
| Database | `ete_digital` |
| App User | `ete_user` |
| App Password | `ete_dev_password_change_in_prod` |
| Host | `localhost:5432` |

---

## Access Points (When Running)

| Service | URL |
|---------|-----|
| Frontend | <http://localhost:5173> |
| Backend API Docs | <http://localhost:8000/docs> |
| Backend ReDoc | <http://localhost:8000/redoc> |
| Health Check | <http://localhost:8000/health> |

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can open <http://localhost:8000/docs>
- [ ] Can open <http://localhost:5173>
- [ ] Can register a new user
- [ ] Can login
- [ ] Frontend can call backend APIs
- [ ] No errors in browser console

---

**Happy Testing! 🚀**
