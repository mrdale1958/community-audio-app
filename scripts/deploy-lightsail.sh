#!/bin/bash
# scripts/deploy-lightsail.sh

APP_DIR="/var/www/read-my-name"
BACKUP_DIR="/var/backups/read-my-name"

echo "📦 Deploying Read My Name to Lightsail..."

# Create backup of current deployment
if [ -d "$APP_DIR" ]; then
    sudo mkdir -p $BACKUP_DIR
    sudo cp -r $APP_DIR $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)
fi

# Pull latest code
cd $APP_DIR
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Update environment variables
sudo cp .env.production /var/www/read-my-name/.env.local

# Restart application with PM2
pm2 reload ecosystem.config.js

# Update nginx configuration if needed
sudo nginx -t && sudo systemctl reload nginx

echo "🎉 Deployment complete!"