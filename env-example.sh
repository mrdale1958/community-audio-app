# Database
DATABASE_URL="postgresql://username:password@localhost:5432/community_audio"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AWS Configuration (for Lightsail deployment)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key" 
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="community-audio-files"

# Email Service (AWS SES)
AWS_SES_REGION="us-east-1"
FROM_EMAIL="noreply@yourdomain.com"

# SMS Service (AWS SNS)
AWS_SNS_REGION="us-east-1"

# File Upload
MAX_FILE_SIZE="50mb"
UPLOAD_DIR="./uploads"

# Audio Processing
AUDIO_PROCESSING_QUEUE="community-audio-processing"

# Development
NODE_ENV="development"