# 🚀 ETE Digital - Quick Start Guide

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Docker** and Docker Compose
- **PostgreSQL** 14+ (or use Docker)
- **Redis** (or use Docker)

---

## 🏁 Quick Start (5 Minutes)

### 1. Clone and Setup

```bash
# Navigate to project
cd ete-digital

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start Backend with Docker

```bash
# Start all backend services (PostgreSQL, Redis, MinIO, Backend API)
cd infra/docker
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

**Backend will be running at**: `http://localhost:8000`  
**API Docs**: `http://localhost:8000/docs`

### 3. Start Frontend

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will be running at**: `http://localhost:5173`

---

## ✅ Verify Installation

### Backend Health Check

```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### Frontend Access

Open `http://localhost:5173` in your browser. You should see the ETE Digital landing page.

---

## 👤 Create Test Users

### Option 1: Using API Docs

1. Go to `http://localhost:8000/docs`
2. Find `POST /api/auth/register`
3. Click "Try it out"
4. Use this payload:

**Candidate:**

```json
{
  "email": "candidate@test.com",
  "password": "Test123!@#",
  "full_name": "John Candidate",
  "role": "candidate"
}
```

**Employer:**

```json
{
  "email": "employer@test.com",
  "password": "Test123!@#",
  "full_name": "Jane Employer",
  "role": "employer"
}
```

### Option 2: Using Frontend

1. Navigate to `http://localhost:5173/register`
2. Fill in the registration form
3. Select role (Candidate or Employer)
4. Submit

**Note**: Email verification is optional in development mode.

---

## 🧪 Test User Flows

### Candidate Flow

1. **Login** at `/login` with candidate credentials
2. **Browse Jobs** at `/jobs`
   - Use filters (location, type, salary)
   - Search by keyword
3. **View Job Details** - Click any job card
4. **Apply** - Fill application form
5. **Complete Tryout** (if job has one)
   - Click "View Tryout" on job details
   - Submit solution (URL/Code/Text)
6. **Manage Vault**
   - Go to `/vault`
   - Add portfolio item
   - Create share token
   - Copy share link
7. **Dashboard** - View stats and recent activity

### Employer Flow

1. **Login** at `/login` with employer credentials
2. **Dashboard** - View quick actions
3. **(Coming Soon)** Post jobs, create tryouts, review applications

### Public Features

1. **Job Search** - Browse without login at `/jobs`
2. **Shared Portfolios** - Access via share token at `/shared/{token}`

---

## 🔧 Configuration

### Backend Environment (`.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ete_digital

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (CHANGE IN PRODUCTION!)
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (Optional for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# MinIO (File Storage)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### Frontend Environment (`.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## 📊 Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | <http://localhost:5173> | - |
| **Backend API** | <http://localhost:8000> | - |
| **API Docs (Swagger)** | <http://localhost:8000/docs> | - |
| **PostgreSQL** | localhost:5432 | postgres/postgres |
| **Redis** | localhost:6379 | - |
| **MinIO Console** | <http://localhost:9001> | minioadmin/minioadmin |

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check if ports are in use
netstat -an | findstr "8000"

# Check Docker logs
docker-compose logs backend

# Restart services
docker-compose restart
```

### Frontend build errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Database connection issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### CORS errors

Make sure `CORS_ORIGINS` in backend `.env` includes `http://localhost:5173`:

```env
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

---

## 🎯 Next Steps

### Development

1. **Explore API** - Use Swagger docs at `/docs`
2. **Add Features** - Check `task.md` for roadmap
3. **Run Tests** (when implemented):

   ```bash
   # Backend
   cd backend
   pytest
   
   # Frontend
   cd frontend
   npm test
   ```

### Production Deployment

1. **Update environment variables** (secrets, database URLs)
2. **Build frontend**:

   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy backend** (Docker, Kubernetes, etc.)
4. **Deploy frontend** (Vercel, Netlify, S3+CloudFront)
5. **Configure HTTPS** (Let's Encrypt, CloudFlare)
6. **Setup monitoring** (Sentry, Prometheus)

---

## 📚 Documentation

- **README.md** - Project overview
- **CONTRIBUTING.md** - Contribution guidelines
- **task.md** - Development roadmap
- **API Docs** - <http://localhost:8000/docs>

---

## 🆘 Need Help?

1. Check the logs:
   - Backend: `docker-compose logs backend`
   - Frontend: Check browser console
2. Review environment variables
3. Ensure all services are running
4. Check [GitHub Issues](https://github.com/yourusername/ete-digital/issues)

---

**Built with** ❤️ **for the open-source community**
