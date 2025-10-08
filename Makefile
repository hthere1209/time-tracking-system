# Makefile for Time Tracking System
# Provides convenient shortcuts for common Docker commands

.PHONY: help start stop restart logs build clean dev test status backup

help: ## Show this help message
	@echo "Time Tracking System - Docker Commands"
	@echo "========================================"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

start: ## Start the application in production mode
	docker-compose up -d
	@echo ""
	@echo "✓ Application started!"
	@echo "Access at: http://localhost:3000"

stop: ## Stop the application
	docker-compose down
	@echo "✓ Application stopped"

restart: ## Restart the application
	docker-compose restart
	@echo "✓ Application restarted"

logs: ## View application logs (follow mode)
	docker-compose logs -f

logs-app: ## View app logs only
	docker-compose logs -f app

logs-db: ## View database logs only
	docker-compose logs -f sqlserver

build: ## Rebuild and start the application
	docker-compose up -d --build
	@echo "✓ Application rebuilt and started"

clean: ## Stop and remove containers, networks (keeps data)
	docker-compose down
	@echo "✓ Containers removed (data preserved)"

clean-all: ## Stop and remove everything including data (DESTRUCTIVE!)
	@echo "⚠️  WARNING: This will delete all data!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read confirm
	docker-compose down -v
	@echo "✓ Everything removed including data"

dev: ## Start in development mode with hot reload
	docker-compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✓ Development environment started!"
	@echo "Access at: http://localhost:3000"

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down
	@echo "✓ Development environment stopped"

dev-logs: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

test: ## Run the test script
	@if [ -f docker-test.sh ]; then \
		chmod +x docker-test.sh && ./docker-test.sh; \
	else \
		echo "Test script not found"; \
	fi

status: ## Show container status
	docker-compose ps

health: ## Check application health
	@echo "Checking application health..."
	@curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/health
	@echo ""

backup: ## Create database backup
	@echo "Creating database backup..."
	docker exec timetrack-sqlserver /opt/mssql-tools/bin/sqlcmd \
		-S localhost -U sa -P "YourStrong@Passw0rd" \
		-Q "BACKUP DATABASE TimeTrackDB TO DISK = '/var/opt/mssql/backup/TimeTrackDB_$$(date +%Y%m%d_%H%M%S).bak'"
	@echo "✓ Backup created in container at /var/opt/mssql/backup/"

exec-app: ## Execute shell in app container
	docker exec -it timetrack-app sh

exec-db: ## Execute bash in database container
	docker exec -it timetrack-sqlserver bash

sql: ## Connect to SQL Server CLI
	docker exec -it timetrack-sqlserver /opt/mssql-tools/bin/sqlcmd \
		-S localhost -U sa -P "YourStrong@Passw0rd"

prune: ## Remove unused Docker resources
	docker system prune -f
	@echo "✓ Unused Docker resources removed"

update: ## Pull latest code and restart
	git pull
	$(MAKE) build
	@echo "✓ Application updated"

install: ## Initial setup - start everything
	@echo "Setting up Time Tracking System..."
	$(MAKE) start
	@echo ""
	@echo "⏳ Waiting for initialization (30 seconds)..."
	@sleep 30
	@echo ""
	@echo "✓ Setup complete!"
	@echo ""
	@echo "Access the application at: http://localhost:3000"
	@echo "Username: admin"
	@echo "Password: admin123"

.DEFAULT_GOAL := help

