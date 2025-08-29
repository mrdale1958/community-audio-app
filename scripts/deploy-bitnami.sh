#!/bin/bash
# scripts/deploy-bitnami.sh
# Deployment script for Bitnami Apache stack on AWS Lightsail

set -e  # Exit on any error

ENVIRONMENT=${1:-staging}
COMMIT_SHA=${2:-latest}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Environment-specific configuration
if [ "$ENVIRONMENT" = "production" ]; then
    APP_DIR="/home/bitnami/readmyname"
    PORT=3100
    BRANCH="main" 
    DB_NAME="readmyname_production"
else
    APP_DIR="/home/bitnami/readmyname-staging"
    PORT=3101
    BRANCH="staging"
    DB_NAME="readmyname_staging"
fi

BACKUP_DIR="/home/bitnami/backups/readmyname"
CONFIG_DIR="/home/bitnami/config"
REPO_URL="https://github.com/mrdale1958/community-audio-app.git"  # Update this
PM2_APP_NAME="readmyname-$ENVIRONMENT"

echo "🚀 Starting deployment to $ENVIRONMENT environment..."
echo "📊 App Directory: $APP_DIR"
echo "🌐 Port: $PORT"
echo "🔧 Commit: $COMMIT_SHA"

# Create necessary directories
echo "📁 Creating directories..."
echo "  - Backup dir: $BACKUP_DIR"
echo "  - App dir: $APP_DIR"
echo "  - Config dir: $CONFIG_DIR"

mkdir -p "$BACKUP_DIR"
mkdir -p "$APP_DIR" 
mkdir -p "$CONFIG_DIR"
mkdir -p "/home/bitnami/readmyname/uploads"
mkdir -p "/home/bitnami/readmyname-staging/uploads"
sudo mkdir -p "/opt/bitnami/apache/logs"

# Ensure proper ownership (bitnami user should already own /home/bitnami)
chmod 755 "$APP_DIR"
chmod 755 "$CONFIG_DIR"
chmod 755 "$BACKUP_DIR"

# Backup current deployment if it exists
if [ -d "$APP_DIR/.git" ]; then
    echo "📦 Creating backup of current deployment..."
    cp -r "$APP_DIR" "$BACKUP_DIR/$TIMESTAMP"
    echo "✅ Backup created at $BACKUP_DIR/$TIMESTAMP"
fi

# Clone or update repository
if [ ! -d "$APP_DIR/.git" ]; then
    echo "📥 Cloning repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
else
    echo "🔄 Updating repository..."
    cd "$APP_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
fi

# Checkout specific commit if provided
if [ "$COMMIT_SHA" != "latest" ]; then
    echo "🔍 Checking out commit $COMMIT_SHA..."
    git checkout "$COMMIT_SHA"
fi

# Install Node.js 18 if not present (Bitnami usually has older version)
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt "18" ]; then
    echo "📦 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Set up environment variables
echo "🔧 Setting up environment variables..."
if [ "$ENVIRONMENT" = "production" ]; then
    ENV_FILE=".env.production"
else
    ENV_FILE=".env.staging"
fi

# Copy environment file if it exists
if [ -f "$CONFIG_DIR/$ENV_FILE" ]; then
    cp "$CONFIG_DIR/$ENV_FILE" .env.local
    echo "✅ Environment variables copied from $CONFIG_DIR/$ENV_FILE"
else
    echo "⚠️  Warning: Environment file not found at $CONFIG_DIR/$ENV_FILE"
    echo "📝 Creating minimal .env.local file..."
    cat > .env.local << EOF
NODE_ENV=production
PORT=$PORT
NEXTAUTH_URL=https://www.aidsquilttouch.org/readmyname
NEXTAUTH_SECRET=your-nextauth-secret-here
DATABASE_URL=file:./prisma/dev.db
EOF
    echo "⚠️  Please update .env.local with proper configuration"
fi

# Set up database
echo "🗄️  Setting up database..."

# Ensure .env.local exists before running Prisma commands
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file is required for database setup"
    exit 1
fi

# Generate Prisma client
npx prisma generate

# Check if database exists and run appropriate commands
DB_PATH=$(grep DATABASE_URL .env.local | cut -d'=' -f2 | sed 's/file://' | sed 's/"//g')
if [[ "$DB_PATH" == *"file:"* ]] || [[ "$DB_PATH" == *".db"* ]]; then
    # SQLite database
    DB_FILE=$(echo $DB_PATH | sed 's/.*file://' | sed 's/.*\///')
    if [ ! -f "prisma/$DB_FILE" ]; then
        echo "📊 Creating new SQLite database..."
        npx prisma migrate deploy
        npx prisma db seed 2>/dev/null || echo "ℹ️  No seed file found, skipping seeding"
    else
        echo "🔄 Running database migrations..."
        npx prisma migrate deploy
    fi
else
    # PostgreSQL or other database
    echo "🔄 Running database migrations..."
    npx prisma migrate deploy
fi

# Build the application
echo "🏗️  Building application..."
npm run build

# Update PM2 ecosystem file for this environment
echo "🔧 Configuring PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: '/opt/bitnami/apache/logs/readmyname-${ENVIRONMENT}-error.log',
    out_file: '/opt/bitnami/apache/logs/readmyname-${ENVIRONMENT}-out.log',
    log_file: '/opt/bitnami/apache/logs/readmyname-${ENVIRONMENT}.log'
  }]
};
EOF

# Start or restart the application with PM2
echo "🚀 Starting application with PM2..."
if pm2 list | grep -q $PM2_APP_NAME; then
    echo "🔄 Reloading existing PM2 process..."
    pm2 reload $PM2_APP_NAME --update-env
else
    echo "🆕 Starting new PM2 process..."
    pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save
pm2 startup | tail -n 1 | sudo bash || echo "PM2 startup already configured"

# Update Apache configuration if needed
APACHE_CONFIG="/opt/bitnami/apache/conf/vhosts/readmyname.conf"
if [ ! -f "$APACHE_CONFIG" ]; then
    echo "📝 Installing Apache configuration..."
    sudo cp config/apache/readmyname.conf $APACHE_CONFIG
    
    # Enable required Apache modules
    sudo /opt/bitnami/apache/bin/httpd -M | grep -q proxy_module || {
        echo "🔧 Enabling Apache proxy modules..."
        echo "LoadModule proxy_module modules/mod_proxy.so" | sudo tee -a /opt/bitnami/apache/conf/httpd.conf
        echo "LoadModule proxy_http_module modules/mod_proxy_http.so" | sudo tee -a /opt/bitnami/apache/conf/httpd.conf
        echo "LoadModule headers_module modules/mod_headers.so" | sudo tee -a /opt/bitnami/apache/conf/httpd.conf
    }
    
    # Include the vhost in main config if not already included
    if ! grep -q "readmyname.conf" /opt/bitnami/apache/conf/bitnami/bitnami.conf; then
        echo 'Include "/opt/bitnami/apache/conf/vhosts/readmyname.conf"' | sudo tee -a /opt/bitnami/apache/conf/bitnami/bitnami.conf
    fi
fi

# Test Apache configuration and reload
echo "🔧 Testing Apache configuration..."
sudo /opt/bitnami/ctlscript.sh restart apache
if [ $? -eq 0 ]; then
    echo "✅ Apache restarted successfully"
else
    echo "❌ Apache restart failed, check configuration"
    exit 1
fi

# Health check
echo "🏥 Performing health check..."
sleep 10
HEALTH_URL="http://localhost:$PORT/api/health"
if curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed, but deployment completed"
    echo "🔍 Check logs: pm2 logs $PM2_APP_NAME"
fi

# Set up log rotation
echo "📊 Setting up log rotation..."
sudo tee /etc/logrotate.d/readmyname > /dev/null << EOF
/opt/bitnami/apache/logs/readmyname*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    copytruncate
}
EOF

# Final status report
echo ""
echo "🎉 Deployment completed successfully!"
echo "📊 Environment: $ENVIRONMENT"
echo "🌐 URL: https://www.aidsquilttouch.org/readmyname"
echo "📱 Port: $PORT"
echo "📝 Logs: pm2 logs $PM2_APP_NAME"
echo "🔧 PM2 Status: pm2 list"
echo ""
echo "📋 Next steps:"
echo "1. Update $CONFIG_DIR/$ENV_FILE with proper environment variables"
echo "2. Set up SSL certificate if needed"
echo "3. Configure backup strategy"
echo "4. Monitor application logs"