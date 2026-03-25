#!/bin/bash
# Auto-update Evolution API script
# Runs weekly to check and update Evolution API image

LOG_FILE="/var/log/evolution-auto-update.log"
COMPOSE_DIR="/opt/evolution-whatsapp"

echo "[$(date)] Starting auto-update check..." >> $LOG_FILE

cd $COMPOSE_DIR

# Get current version
CURRENT_VERSION=$(docker inspect atendai/evolution-api:v1.8.7 --format='{{.RepoDigests}}' 2>/dev/null || echo "unknown")

# Pull latest image
docker pull atendai/evolution-api:latest >> $LOG_FILE 2>&1

# Get new version digest
NEW_VERSION=$(docker inspect atendai/evolution-api:latest --format='{{.RepoDigests}}' 2>/dev/null || echo "unknown")

# Compare versions
if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
    echo "[$(date)] New version detected, updating..." >> $LOG_FILE
    
    # Update docker-compose to use latest
    sed -i 's|atendai/evolution-api:v[0-9.]*|atendai/evolution-api:latest|g' docker-compose.yml
    
    # Restart evolution-api service only (no downtime for others)
    docker compose up -d evolution-api >> $LOG_FILE 2>&1
    
    echo "[$(date)] Update completed successfully" >> $LOG_FILE
else
    echo "[$(date)] No update needed, current version is latest" >> $LOG_FILE
fi
