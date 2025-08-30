#!/bin/bash
# Fix Apache configuration on server
# Run this script on the server if you're getting ProxyPass syntax errors

echo "🔧 Fixing Apache configuration..."

# Ensure the vhosts directory exists
sudo mkdir -p /opt/bitnami/apache/conf/vhosts

# Copy the corrected configuration
if [ -f "/home/bitnami/readmyname/config/apache/readmyname.conf" ]; then
    echo "📄 Copying updated Apache configuration..."
    sudo cp /home/bitnami/readmyname/config/apache/readmyname.conf /opt/bitnami/apache/conf/vhosts/readmyname.conf
    
    echo "🔍 Testing Apache configuration syntax..."
    if sudo /opt/bitnami/apache/bin/httpd -t -D DUMP_VHOSTS -D DUMP_MODULES; then
        echo "✅ Apache configuration syntax is valid"
        
        echo "🔄 Restarting Apache..."
        sudo /opt/bitnami/ctlscript.sh restart apache
        
        if [ $? -eq 0 ]; then
            echo "✅ Apache restarted successfully"
        else
            echo "❌ Apache restart failed"
            exit 1
        fi
    else
        echo "❌ Apache configuration syntax error detected"
        echo "📋 Current configuration around line 41:"
        sudo head -n 45 /opt/bitnami/apache/conf/vhosts/readmyname.conf | tail -n 10
        exit 1
    fi
else
    echo "❌ Configuration file not found at /home/bitnami/readmyname/config/apache/readmyname.conf"
    echo "📝 Make sure you've run the deployment script first"
    exit 1
fi

echo "🎉 Apache configuration fixed successfully!"