# 🔐 Security Setup Instructions

## CRITICAL: Secret Management

### Production Server Setup

**IMPORTANT**: The hardcoded secret has been removed from `ecosystem.config.js`. You MUST set the environment variable on your production server.

### 1. Set the New Secret on Production Server

SSH into your production server and run:

```bash
# Set the new secret (replace with the generated value)
export NEXTAUTH_SECRET="0BPWYSH9aEkYpSf16U1W8SRkW+T4tpUJNcUYb3kE+c8="

# Or add to your shell profile for persistence
echo 'export NEXTAUTH_SECRET="0BPWYSH9aEkYpSf16U1W8SRkW+T4tpUJNcUYb3kE+c8="' >> ~/.bashrc
source ~/.bashrc
```

### 2. Verify Environment Variable

```bash
echo $NEXTAUTH_SECRET
# Should output: 0BPWYSH9aEkYpSf16U1W8SRkW+T4tpUJNcUYb3kE+c8=
```

### 3. Restart PM2 Application

```bash
pm2 restart readmyname-production
pm2 logs readmyname-production
```

### 4. Alternative: Use PM2 Environment File

Create `/home/bitnami/.env.production`:

```bash
NEXTAUTH_SECRET=0BPWYSH9aEkYpSf16U1W8SRkW+T4tpUJNcUYb3kE+c8=
```

Then update ecosystem.config.js to load it:

```js
env: {
  NODE_ENV: "production",
  PORT: 3100,
  NEXTAUTH_URL: "https://www.aidsquilttouch.org/readmyname"
},
env_file: "/home/bitnami/.env.production"
```

## Security Notes

- **Never commit secrets to Git**
- **Regenerate secrets if they're ever exposed**
- **Use different secrets for dev/staging/production**
- **Rotate secrets periodically (every 90 days)**

## Generated Secret Details

- **Algorithm**: OpenSSL random bytes, base64 encoded
- **Length**: 256 bits (32 bytes)
- **Generated on**: $(date)
- **Old secret**: REVOKED (was in ecosystem.config.js)

## Emergency Response

If secrets are compromised:

1. Generate new secret: `openssl rand -base64 32`
2. Update environment variable
3. Restart application
4. Invalidate all existing sessions