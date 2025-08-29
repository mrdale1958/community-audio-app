#!/bin/bash
# scripts/setup-github-secrets.sh
# Helper script to set up GitHub repository secrets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 GitHub Secrets Setup Helper${NC}"
echo "This script will help you set up the required GitHub secrets for automated deployment."
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    echo ""
    echo "On macOS: brew install gh"
    echo "On Ubuntu: sudo apt install gh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔑 Please authenticate with GitHub first:${NC}"
    echo "gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is ready${NC}"
echo ""

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo -e "📁 Repository: ${GREEN}$REPO${NC}"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_value=$3
    
    if [ -n "$secret_value" ]; then
        echo "$secret_value" | gh secret set "$secret_name"
        echo -e "✅ ${GREEN}$secret_name${NC} set successfully"
    else
        echo -e "⏭️  ${YELLOW}Skipping $secret_name (empty value)${NC}"
    fi
}

# Collect secret values
echo -e "${YELLOW}📝 Please provide the following information:${NC}"
echo ""

read -p "🖥️  Lightsail server IP address: " LIGHTSAIL_HOST
read -p "👤 SSH username (usually 'bitnami'): " LIGHTSAIL_USER
read -p "🌐 Production URL (https://www.aidsquilttouch.org/readmyname): " PROD_HEALTH_URL
read -p "🧪 Staging URL (optional): " STAGING_HEALTH_URL
read -p "💬 Slack webhook URL (optional, for notifications): " SLACK_WEBHOOK_URL

echo ""
echo -e "${YELLOW}🔑 SSH Private Key Setup${NC}"
echo "Please provide the path to your SSH private key file (.pem):"
read -p "📁 SSH key file path: " SSH_KEY_PATH

if [ -f "$SSH_KEY_PATH" ]; then
    SSH_KEY_CONTENT=$(cat "$SSH_KEY_PATH")
else
    echo -e "${RED}❌ SSH key file not found: $SSH_KEY_PATH${NC}"
    exit 1
fi

# Set defaults
LIGHTSAIL_USER=${LIGHTSAIL_USER:-bitnami}
PROD_HEALTH_URL=${PROD_HEALTH_URL:-https://www.aidsquilttouch.org/readmyname}

echo ""
echo -e "${GREEN}🚀 Setting up GitHub secrets...${NC}"
echo ""

# Set all secrets
set_secret "LIGHTSAIL_HOST" "Server IP address" "$LIGHTSAIL_HOST"
set_secret "LIGHTSAIL_USER" "SSH username" "$LIGHTSAIL_USER"
set_secret "LIGHTSAIL_SSH_KEY" "SSH private key" "$SSH_KEY_CONTENT"
set_secret "PROD_HEALTH_URL" "Production health check URL" "$PROD_HEALTH_URL"
set_secret "STAGING_HEALTH_URL" "Staging health check URL" "$STAGING_HEALTH_URL"
set_secret "SLACK_WEBHOOK_URL" "Slack webhook for notifications" "$SLACK_WEBHOOK_URL"

echo ""
echo -e "${GREEN}🎉 GitHub secrets setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update the repository URL in scripts/deploy-bitnami.sh"
echo "2. Set up your environment files on the server:"
echo "   - /opt/bitnami/config/.env.production"
echo "   - /opt/bitnami/config/.env.staging (optional)"
echo "3. Run the initial deployment manually or push to main/staging branch"
echo ""
echo -e "${GREEN}✅ You're ready for automated deployments!${NC}"