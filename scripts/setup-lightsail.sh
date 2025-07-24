#!/bin/bash
# scripts/setup-lightsail.sh

echo "🚀 Setting up Read My Name on AWS Lightsail..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx for reverse proxy
sudo apt install -y nginx

# Setup application directory
sudo mkdir -p /var/www/read-my-name
sudo chown $USER:$USER /var/www/read-my-name

echo "✅ Base system setup complete!"