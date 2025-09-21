# Deployment Guide for Bitnami Lightsail

This guide covers deploying the Read My Name application to a Bitnami Apache stack on AWS Lightsail.

## Directory Structure

The application uses `/home/bitnami` for all application files:

```
/home/bitnami/
├── readmyname/                    # Production application (port 3100)
│   ├── uploads/                   # Audio file uploads
│   └── .git/                      # Git repository
├── readmyname-staging/            # Staging application (port 3101)
│   └── uploads/                   # Staging uploads
├── config/                        # Environment configurations
│   ├── .env.production           # Production environment variables
│   └── .env.staging              # Staging environment variables
├── backups/                       # Application backups
│   ├── readmyname/               # App deployment backups
│   └── db/                       # Database backups
└── scripts/                       # Custom deployment scripts
```

## Port Configuration

- **Production**: Port `3100` → `https://www.aidsquilttouch.org/readmyname/`
- **Staging**: Port `3101` → `https://staging.aidsquilttouch.org/readmyname/`

## Prerequisites

1. **Bitnami Apache stack** running on AWS Lightsail
2. **Domain**: `www.aidsquilttouch.org` pointing to your Lightsail instance
3. **SSH access** to your Lightsail instance
4. **GitHub repository** with your code

## Quick Setup Commands

**Create the directory structure:**
```bash
ssh bitnami@your-server-ip
mkdir -p /home/bitnami/{readmyname,readmyname-staging,config,backups/readmyname,scripts}
mkdir -p /home/bitnami/readmyname/uploads
mkdir -p /home/bitnami/readmyname-staging/uploads
```

**Set up environment files:**
```bash
# After cloning your repository, copy templates and edit with your values
cp config/env/.env.production.template /home/bitnami/config/.env.production
cp config/env/.env.staging.template /home/bitnami/config/.env.staging

# Edit with your actual configuration
nano /home/bitnami/config/.env.production
nano /home/bitnami/config/.env.staging
```

## Initial Server Setup

### 1. Connect to Your Bitnami Server

```bash
ssh -i your-key.pem bitnami@your-server-ip
```

### 2. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Git if not present
sudo apt install -y git

# Create application directories
mkdir -p /home/bitnami/readmyname
mkdir -p /home/bitnami/readmyname-staging
mkdir -p /home/bitnami/config
mkdir -p /home/bitnami/backups
mkdir -p /home/bitnami/readmyname/uploads
mkdir -p /home/bitnami/readmyname-staging/uploads
```

### 3. Configure Environment Files

Create your environment files:

```bash
# Production environment
cp config/env/.env.production.template /home/bitnami/config/.env.production
nano /home/bitnami/config/.env.production  # Edit with your values

# Staging environment (optional)
cp config/env/.env.staging.template /home/bitnami/config/.env.staging
nano /home/bitnami/config/.env.staging  # Edit with your values
```

### 4. Set Up Database

For production, it's recommended to use PostgreSQL:

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database user and database
sudo -u postgres createuser -P readmyname_user  # Enter password when prompted
sudo -u postgres createdb -O readmyname_user readmyname_production
sudo -u postgres createdb -O readmyname_user readmyname_staging
```

## GitHub Actions Setup

### 1. Repository Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `LIGHTSAIL_SSH_KEY` | Private SSH key for server access | Contents of your .pem file |
| `LIGHTSAIL_HOST` | Server IP address | `12.34.56.78` |
| `LIGHTSAIL_USER` | SSH username | `bitnami` |
| `PROD_HEALTH_URL` | Production health check URL | `https://www.aidsquilttouch.org/readmyname` |
| `STAGING_HEALTH_URL` | Staging health check URL | `https://staging.aidsquilttouch.org/readmyname` |
| `SLACK_WEBHOOK_URL` | Slack notifications (optional) | `https://hooks.slack.com/...` |

### 2. Update Repository URL

Edit `scripts/deploy-bitnami.sh` and update the repository URL:

```bash
REPO_URL="https://github.com/yourusername/community-audio-app.git"
```

### 3. Branch Strategy

- `main` branch → Production deployment
- `staging` branch → Staging deployment
- Feature branches → Manual testing, no auto-deploy

## Apache Configuration

### 1. Install Virtual Host Configuration

```bash
# Copy the Apache configuration
sudo cp /opt/bitnami/readmyname/config/apache/readmyname.conf /opt/bitnami/apache/conf/vhosts/

# Include it in main Apache config
echo 'Include "/opt/bitnami/apache/conf/vhosts/readmyname.conf"' | sudo tee -a /opt/bitnami/apache/conf/bitnami/bitnami.conf

# Enable required modules
sudo /opt/bitnami/apache/bin/httpd -M | grep -q proxy_module || {
    echo "LoadModule proxy_module modules/mod_proxy.so" | sudo tee -a /opt/bitnami/apache/conf/httpd.conf
    echo "LoadModule proxy_http_module modules/mod_proxy_http.so" | sudo tee -a /opt/bitnami/apache/conf/httpd.conf
    echo "LoadModule headers_module modules/mod_headers.so" | sudo tee -a /opt/bitnami/apache/conf/httpd.conf
}

# Test and restart Apache
sudo /opt/bitnami/apache/bin/httpd -t
sudo /opt/bitnami/ctlscript.sh restart apache
```

### 2. SSL Certificate

If you need to set up SSL certificates:

```bash
# Using Let's Encrypt with Bitnami
sudo /opt/bitnami/letsencrypt/scripts/generate-certificate.sh -m your-email@domain.com -d www.aidsquilttouch.org -d staging.aidsquilttouch.org
```

## Manual Deployment

For the first deployment or manual deployments:

```bash
# Clone the repository
cd /home/bitnami
git clone -b main https://github.com/yourusername/community-audio-app.git readmyname

# Run the deployment script
cd readmyname
chmod +x scripts/deploy-bitnami.sh
./scripts/deploy-bitnami.sh production
```

## Health Checks and API Endpoints

Add a health check endpoint to your application:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

## Monitoring and Logs

### View Application Logs

```bash
# PM2 logs
pm2 logs readmyname-production
pm2 logs readmyname-staging

# Apache logs
tail -f /opt/bitnami/apache/logs/readmyname_access.log
tail -f /opt/bitnami/apache/logs/readmyname_error.log

# Application logs
tail -f /opt/bitnami/apache/logs/readmyname-production.log
```

### PM2 Management

```bash
# List all processes
pm2 list

# Restart application
pm2 restart readmyname-production

# Stop application
pm2 stop readmyname-production

# View detailed info
pm2 show readmyname-production
```

## Backup Strategy

### Database Backups

```bash
# Create backup script
mkdir -p /home/bitnami/scripts
cat > /home/bitnami/scripts/backup-db.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U readmyname_user readmyname_production > /home/bitnami/backups/db_production_$TIMESTAMP.sql
pg_dump -h localhost -U readmyname_user readmyname_staging > /home/bitnami/backups/db_staging_$TIMESTAMP.sql

# Keep only last 7 days of backups
find /home/bitnami/backups -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x /home/bitnami/scripts/backup-db.sh

# Add to crontab for daily backups
echo "0 2 * * * /home/bitnami/scripts/backup-db.sh" | crontab -
```

### File Backups

```bash
# Backup uploaded files
rsync -av /home/bitnami/readmyname/uploads/ /home/bitnami/backups/uploads_$(date +%Y%m%d)/
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3100/3101 are not used by other services
2. **Permission errors**: Check that bitnami user owns application directories
3. **Database connection**: Verify DATABASE_URL is correct and database exists
4. **Apache proxy**: Check that proxy modules are loaded

### Debug Commands

```bash
# Check port usage
sudo netstat -tlnp | grep :3100

# Test Node.js application directly
cd /home/bitnami/readmyname
npm start

# Test Apache configuration
sudo /opt/bitnami/apache/bin/httpd -t

# Check disk space
df -h

# Check memory usage
free -m
```

## Scaling Considerations

### Multiple Instances

To run multiple instances for high availability:

```javascript
// Update ecosystem.config.js
module.exports = {
  apps: [{
    name: 'readmyname-production',
    script: 'npm',
    args: 'start',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    // ... other settings
  }]
};
```

### Load Balancing

For multiple servers, set up a load balancer in front of your Lightsail instances.

### Monitoring

Consider adding application monitoring:

- **Uptime monitoring**: Pingdom, UptimeRobot
- **Error tracking**: Sentry, Bugsnag  
- **Performance monitoring**: New Relic, DataDog
- **Log aggregation**: ELK stack, Splunk

## Security Checklist

- [ ] SSL certificates installed and auto-renewing
- [ ] Firewall configured (allow only 80, 443, 22)
- [ ] SSH key-based authentication only
- [ ] Regular security updates scheduled
- [ ] Database access restricted to localhost
- [ ] Environment files have proper permissions (600)
- [ ] File upload directory secured with proper permissions
- [ ] Apache security headers configured

Node.js Version Consistency
To ensure consistent linting, building, and runtime behavior across all environments (local development, CI, and production), all contributors and servers must use the same Node.js version.

Why is this necessary?
Different Node.js versions can cause discrepancies in TypeScript, ESLint, and build results.
Some dependencies and language features may only work in newer Node versions.
Avoids "works on my machine" problems and unexpected production errors.
Required Node.js Version
The required Node.js version for this project is: 22.x

Check your current version with:

How to Set the Correct Node Version
We recommend using nvm (Node Version Manager):

1. Install nvm (if not already installed)
Then activate nvm in your shell:

2. Install and use Node.js 22
3. Reinstall dependencies
After switching Node versions, always run:

This ensures all dependencies are installed exactly as specified in package-lock.json.

Troubleshooting
If you see lint/build errors on the server that do not appear locally, check your Node.js version and align it with the project requirement.
Always use local project binaries (npx tsc, npx eslint) rather than global installs.
Summary:
Keep Node.js versions in sync across all environments to avoid unexpected errors and ensure consistent development experience.
