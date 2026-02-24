# Quick Setup with Docker

## Option 1: Docker Compose (RECOMMENDED) ✅

**Easiest way** - Sets up everything automatically!

### Step 1: Start Infrastructure Services

```bash
cd infra\docker
docker-compose up -d postgres redis minio
```

This will start:

- ✅ PostgreSQL (port 5432) - Database automatically created
- ✅ Redis (port 6379) - For caching
- ✅ MinIO (ports 9000, 9001) - For file storage

### Step 2: Run Database Migrations

```bash
cd ..\..\backend
venv\Scripts\activate
alembic upgrade head
```

### Step 3: Start Backend Server

```bash
# Still in backend directory
uvicorn app.main:app --reload --port 8000
```

### Step 4: Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

---

## Option 2: Use Your Local PostgreSQL

If you want to use your existing PostgreSQL instead of Docker:

### Create Database Manually

```bash
# Open pgAdmin or psql
psql -U postgres
```

Then run:

```sql
CREATE DATABASE ete_digital;
CREATE USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';
GRANT ALL PRIVILEGES ON DATABASE ete_digital TO ete_user;
```

Or use the SQL file:

```bash
psql -U postgres -f backend\setup_database.sql
```

Then follow steps 2-4 from Option 1.

---

## Useful Docker Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v
```

---

## Access Points After Setup

- **Backend API**: <http://localhost:8000/docs>
- **Frontend**: <http://localhost:5173>
- **MinIO Console**: <http://localhost:9001> (minioadmin/minioadmin123)
- **MailHog**: <http://localhost:8025>

---

**Choose Option 1 (Docker) for fastest setup!** 🚀
