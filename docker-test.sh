#!/bin/bash

# Docker Test Script for Time Tracking System
echo "========================================="
echo "   TimeTrack Docker Test Script"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    echo "Please install Docker Compose"
    exit 1
fi

echo "✓ Docker is installed"
echo "✓ Docker Compose is installed"
echo ""

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running!"
    echo "Please start Docker Desktop"
    exit 1
fi

echo "✓ Docker daemon is running"
echo ""

# Build and start containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready (this may take 30-60 seconds)..."
sleep 30

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✓ Containers are running"
else
    echo "❌ Containers failed to start"
    echo "Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo "🔍 Testing application health..."

# Wait for app to be ready
max_attempts=10
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✓ Application is responding"
        break
    fi
    attempt=$((attempt + 1))
    sleep 3
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Application failed to start"
    echo "Check logs with: docker-compose logs app"
    exit 1
fi

echo ""
echo "========================================="
echo "   🎉 Success! TimeTrack is running!"
echo "========================================="
echo ""
echo "📍 Access the application:"
echo "   Main App:  http://localhost:3000"
echo "   Login:     http://localhost:3000/login.html"
echo "   Admin:     http://localhost:3000/admin"
echo ""
echo "👤 Default credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📝 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop:          docker-compose down"
echo "   Restart:       docker-compose restart"
echo ""

