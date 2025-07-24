# Automated backup script
#!/bin/bash
# scripts/backup-lightsail.sh

# Database backup (automatic with Lightsail managed DB)
echo "📊 Database backups managed automatically by Lightsail"

# Application backup
tar -czf /var/backups/app-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  /var/www/read-my-name

# Upload backup to object storage
aws s3 cp /var/backups/app-$(date +%Y%m%d).tar.gz \
  s3://read-my-name-audio/backups/

# Audio files backup (sync to object storage)
aws s3 sync /var/www/read-my-name/uploads/ \
  s3://read-my-name-audio/uploads/ \
  --delete

echo "✅ Backup complete"