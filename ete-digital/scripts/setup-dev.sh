#!/bin/bash

# ETE Digital Development Setup Script

echo "========================================"
echo "  ETE Digital - Development Setup"
echo "========================================"

# Check prerequisites
echo ""
echo "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi
echo "✅ Docker found"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi
echo "✅ Docker Compose found"

# Setup environment files
echo ""
echo "Setting up environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⏭️  backend/.env already exists"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
else
    echo "⏭️  frontend/.env already exists"
fi

# Start Docker services
echo ""
echo "Starting Docker services..."
cd infra/docker
docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "Checking service health..."
docker-compose ps

echo ""
echo "========================================"
echo "  ✨ Setup Complete!"
echo "========================================"
echo ""
echo "Services available at:"
echo "  Frontend:     http://localhost:5173"
echo "  Backend API:  http://localhost:8000"
echo "  API Docs:     http://localhost:8000/api/docs"
echo "  MinIO:        http://localhost:9001"
echo "  MailHog:      http://localhost:8025"
echo ""
echo "Next steps:"
echo "  1. Initialize database: docker exec ete-backend alembic upgrade head"
echo "  2. Start coding!"
echo ""
