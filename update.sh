#!/bin/bash
# Update script for Evolution WhatsApp System
# Usage: ./update.sh [frontend|backend|all]

set -e

COMPOSE_DIR="/opt/evolution-whatsapp"
LOG_FILE="/var/log/evolution-update.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

cd $COMPOSE_DIR

# Pull latest code
log "Pulling latest code from GitHub..."
git pull origin main

# Update based on argument
 case "${1:-all}" in
    frontend)
        log "Updating frontend only..."
        docker compose build --no-cache frontend
        docker compose up -d frontend
        ;;
    backend)
        log "Updating backend only..."
        docker compose build --no-cache backend
        docker compose up -d backend
        ;;
    evolution)
        log "Updating Evolution API only..."
        docker compose pull evolution-api
        docker compose up -d evolution-api
        ;;
    all|*)
        log "Updating all services..."
        docker compose build --no-cache frontend backend
        docker compose pull evolution-api
        docker compose up -d
        ;;
esac

# Clean up old images
log "Cleaning up old images..."
docker image prune -f

log "Update completed!"
docker compose ps
