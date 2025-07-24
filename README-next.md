# Read My Name - Next Phase Development

## 🎉 Recent Achievements

### ✅ Management System Refactoring (Completed)
We successfully refactored the large, monolithic management page into a clean, maintainable architecture:

- **Fixed add user error scoping bug** - Errors now stay in dialogs where they belong
- **Modular component structure** - Separated into focused, single-responsibility components
- **Proper TypeScript integration** - Resolved all import issues with relative paths
- **Clean separation of concerns** - Data hooks, UI components, and business logic properly isolated
- **Maintained all existing functionality** while dramatically improving code quality

### Current Architecture
```
app/manage/page.tsx                     # Clean orchestrator component
types/manage.ts                         # Centralized TypeScript interfaces
hooks/
├── useManageData.ts                    # Data fetching and management
└── useAudioPlayer.ts                   # Audio playback functionality
components/manage/
├── ProjectStats.tsx                    # Statistics dashboard
├── RecordingsTab.tsx                   # Recording management
├── UsersTab.tsx                        # User administration
├── AnalyticsTab.tsx                    # Progress tracking
└── dialogs/                           # Modal components for CRUD operations
```

## 🚀 Next Phase Features

### 1. Exhibition Playback System
**Priority: High** | **Complexity: Medium**

Create a dedicated exhibition interface for public display of approved recordings:

- **Continuous playback queue** - Auto-advance through approved recordings
- **Visual name display** - Show the name being read during playback
- **Progress tracking** - Display progress toward 5,000 recording goal
- **Touch-friendly controls** - Pause, skip, volume for exhibition setup
- **Shuffle and repeat modes** - Various playback patterns for different exhibition needs

**Technical Implementation:**
```typescript
// Exhibition queue management
interface ExhibitionQueue {
  currentRecording: Recording | null
  upcomingRecordings: Recording[]
  playbackMode: 'sequential' | 'shuffle' | 'random'
  autoAdvance: boolean
}

// New API endpoints needed
/api/exhibition/queue          # Get current exhibition queue
/api/exhibition/next          # Advance to next recording
/api/exhibition/status        # Exhibition playback status
```

### 2. Advanced Analytics and Reporting
**Priority: Medium** | **Complexity: Medium**

Expand the current analytics with detailed insights and reporting:

- **Recording quality metrics** - Duration distribution, file size analysis
- **User contribution patterns** - Most active contributors, contribution trends
- **Name list completion tracking** - Which name lists need more recordings
- **Geographic/demographic insights** - If user profiles expanded
- **Export capabilities** - CSV/PDF reports for stakeholders

**Dashboard Enhancements:**
- Interactive charts with Chart.js or D3.js
- Time-based filtering (daily, weekly, monthly views)
- Comparison metrics (current vs previous periods)
- Goal tracking with milestone notifications

### 3. Audio Processing and Waveform Visualization
**Priority: Medium** | **Complexity: High**

Add audio analysis and visual feedback tools:

- **Waveform display** - Visual representation of audio recordings
- **Audio quality analysis** - Detect silence, clipping, background noise
- **Automatic trimming** - Remove silence from beginning/end
- **Volume normalization** - Consistent audio levels across recordings
- **Duration validation** - Flag recordings that are too short/long

**Technical Stack:**
- **Web Audio API** for client-side analysis
- **WaveSurfer.js** for waveform visualization
- **FFmpeg.js** for audio processing (if needed)

### 4. Bulk Operations Interface
**Priority: Low** | **Complexity: Low**

Streamline management of multiple recordings:

- **Bulk approval/rejection** - Select multiple recordings for batch operations
- **Batch user management** - Bulk role changes, account operations
- **Mass export/download** - Download multiple recordings as ZIP
- **Advanced filtering** - Complex queries across multiple fields
- **Bulk edit metadata** - Update multiple recordings simultaneously

## 🌐 Deployment to AWS Lightsail

### Recommended AWS Lightsail Architecture

#### **Option A: Simple Deployment (Recommended for MVP)**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Lightsail     │────│   Lightsail      │────│   Lightsail     │
│   CDN           │    │   Instance       │    │   Database      │
│   Distribution  │    │   (Next.js App)  │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌──────────────────┐
                       │   Lightsail      │
                       │   Object Storage │
                       │   (Audio Files)  │
                       └──────────────────┘
```

#### **Option B: Hybrid Architecture (Future Growth)**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Lightsail CDN │────│   Lightsail      │────│   Lightsail DB  │
│   (Global)      │    │   Load Balancer  │    │   (Managed)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Multiple       │────│   S3 Bucket     │
                       │   Lightsail      │    │   (Large Files) │
                       │   Instances      │    │                 │
                       └──────────────────┘    └─────────────────┘
```

### Lightsail Deployment Configuration

#### **Instance Setup Script**
```bash
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
```

#### **Application Deployment Script**
```bash
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
```

#### **PM2 Ecosystem Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'read-my-name',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/read-my-name',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/read-my-name/error.log',
    out_file: '/var/log/read-my-name/out.log',
    log_file: '/var/log/read-my-name/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
```

#### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/read-my-name
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL certificate (Lightsail Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Audio file handling
    location ~* \.(mp3|wav|ogg|m4a)$ {
        root /var/www/read-my-name/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Large file support
        client_max_body_size 100M;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Upload size limit
        client_max_body_size 100M;
    }
    
    # Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Lightsail Resource Configuration

#### **Instance Specifications**
```bash
# Recommended Lightsail instance sizes by usage:

# Development/Testing
# $10/month - 1 vCPU, 2GB RAM, 40GB SSD
aws lightsail create-instances \
  --instance-names read-my-name-dev \
  --availability-zone us-east-1a \
  --blueprint-id ubuntu_20_04 \
  --bundle-id nano_2_0

# Production (Small - up to 1000 recordings)
# $20/month - 1 vCPU, 4GB RAM, 80GB SSD
aws lightsail create-instances \
  --instance-names read-my-name-prod \
  --availability-zone us-east-1a \
  --blueprint-id ubuntu_20_04 \
  --bundle-id small_2_0

# Production (Medium - up to 5000+ recordings)
# $40/month - 2 vCPUs, 8GB RAM, 160GB SSD
aws lightsail create-instances \
  --instance-names read-my-name-prod \
  --availability-zone us-east-1a \
  --blueprint-id ubuntu_20_04 \
  --bundle-id medium_2_0
```

#### **Database Setup**
```bash
# Create Lightsail managed database
aws lightsail create-relational-database \
  --relational-database-name read-my-name-db \
  --availability-zone us-east-1a \
  --relational-database-blueprint-id postgres_12 \
  --relational-database-bundle-id micro_1_0 \
  --master-database-name readmyname \
  --master-username dbadmin \
  --master-user-password "$(openssl rand -base64 32)"

# $15/month - 1 vCPU, 1GB RAM, 20GB SSD
# Automatic backups, high availability option available
```

#### **Object Storage for Audio Files**
```bash
# Create Lightsail object storage bucket
aws lightsail create-bucket \
  --bucket-name read-my-name-audio \
  --bundle-id small_1_0

# $5/month - 250GB storage, 1TB transfer
# Additional storage: $0.023/GB/month
```

#### **CDN Distribution**
```bash
# Create Lightsail CDN distribution
aws lightsail create-distribution \
  --distribution-name read-my-name-cdn \
  --origin region=us-east-1,name=read-my-name-prod,protocol-policy=http-only \
  --default-cache-behavior behavior=cache \
  --bundle-id small_1_0

# $2.50/month - 50GB data transfer
# Additional transfer: $0.09/GB
```

### Environment Configuration
```bash
# .env.production
DATABASE_URL="postgresql://dbadmin:password@ls-xxxxx.us-east-1.rds.amazonaws.com:5432/readmyname"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret-from-lightsail-secrets"

# Lightsail Object Storage
AWS_ACCESS_KEY_ID="your-lightsail-access-key"
AWS_SECRET_ACCESS_KEY="your-lightsail-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="read-my-name-audio"
AWS_S3_ENDPOINT="https://s3.us-east-1.amazonaws.com"

# Audio file settings
AUDIO_UPLOAD_PATH="/var/www/read-my-name/uploads"
MAX_FILE_SIZE="50MB"
ALLOWED_AUDIO_TYPES="audio/mpeg,audio/wav,audio/ogg,audio/mp4"
```

### Cost Estimation (Monthly)
- **Lightsail Instance (Medium)**: $40
- **Lightsail Database (Micro)**: $15
- **Lightsail Object Storage**: $5 (base) + usage
- **Lightsail CDN**: $2.50 (base) + usage
- **Domain + SSL**: Free (Lightsail managed)
- **Total Base Cost**: ~$62.50/month

**Advantages of Lightsail:**
- ✅ **Simplified management** - Less AWS complexity
- ✅ **Predictable pricing** - Fixed monthly costs
- ✅ **Integrated services** - Database, storage, CDN in one place
- ✅ **Easy scaling** - Resize instances as needed
- ✅ **Managed SSL** - Automatic certificate management
- ✅ **Built-in monitoring** - Basic metrics included

### Backup and Monitoring Strategy
```bash
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
```

## 📊 AIDS Quilt FileMaker Pro Integration

### FileMaker Pro Data Access Strategy

Since the AIDS Quilt database is hosted in FileMaker Pro, we'll need to use FileMaker's web publishing capabilities to access the data:

#### **FileMaker Data API Integration**
```javascript
// lib/filemaker-client.js
class FileMakerQuiltClient {
  constructor() {
    this.baseUrl = 'https://aidsquilt.360works.com'; // FileMaker Server URL
    this.database = 'AIDS_Memorial_Quilt'; // Database name
    this.layout = 'Names_API'; // Layout for API access
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/fmi/data/v1/databases/${this.database}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from('api_user:api_password').toString('base64')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      this.token = data.response.token;
      this.tokenExpiry = Date.now() + (14 * 60 * 1000); // 14 minutes
      return this.token;
    }
    
    throw new Error('FileMaker authentication failed');
  }

  async ensureAuthenticated() {
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  async findRecords(query = {}, layout = this.layout) {
    await this.ensureAuthenticated();
    
    const searchParams = new URLSearchParams();
    if (Object.keys(query).length > 0) {
      searchParams.append('query', JSON.stringify([query]));
    }
    
    const response = await fetch(
      `${this.baseUrl}/fmi/data/v1/databases/${this.database}/layouts/${layout}/records?${searchParams}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.response.data;
    }
    
    throw new Error(`FileMaker query failed: ${response.status}`);
  }

  async getAllNames() {
    console.log('📋 Fetching all names from FileMaker...');
    
    // FileMaker pagination - get records in batches
    const allRecords = [];
    let offset = 1;
    const limit = 100; // FileMaker recommended batch size
    
    while (true) {
      const records = await this.findRecords({}, `Names_API?_offset=${offset}&_limit=${limit}`);
      
      if (!records || records.length === 0) break;
      
      allRecords.push(...records.map(record => ({
        id: record.fieldData.ID,
        firstName: record.fieldData.First_Name,
        lastName: record.fieldData.Last_Name,
        fullName: record.fieldData.Full_Name,
        blockId: record.fieldData.Block_ID,
        panelNumber: record.fieldData.Panel_Number,
        coordinates: {
          x: record.fieldData.X_Coordinate,
          y: record.fieldData.Y_Coordinate,
          width: record.fieldData.Width,
          height: record.fieldData.Height
        },
        dateAdded: record.fieldData.Date_Added,
        lastModified: record.modificationTimestamp
      })));
      
      offset += limit;
      
      // Rate limiting for FileMaker Server
      await this.sleep(100);
    }
    
    console.log(`📊 Retrieved ${allRecords.length} names from FileMaker`);
    return allRecords;
  }

  async getAllBlocks() {
    console.log('🔲 Fetching all blocks from FileMaker...');
    
    const blocks = await this.findRecords({}, 'Blocks_API');
    
    return blocks.map(record => ({
      id: record.fieldData.Block_ID,
      title: record.fieldData.Block_Title,
      description: record.fieldData.Description,
      imageUrl: record.fieldData.Image_URL,
      thumbnailUrl: record.fieldData.Thumbnail_URL,
      deepZoomUrl: record.fieldData.Deep_Zoom_URL,
      dimensions: {
        width: record.fieldData.Width_Inches,
        height: record.fieldData.Height_Inches
      },
      location: record.fieldData.Current_Location,
      dateCreated: record.fieldData.Date_Created,
      lastModified: record.modificationTimestamp,
      nameCount: record.fieldData.Name_Count
    }));
  }

  async findNamesByBlock(blockId) {
    return await this.findRecords({
      'Block_ID': `=${blockId}`
    }, 'Names_API');
  }

  async findBlocksByName(nameSearch) {
    // Search across multiple name fields
    const searchQueries = [
      { 'First_Name': `*${nameSearch}*` },
      { 'Last_Name': `*${nameSearch}*` },
      { 'Full_Name': `*${nameSearch}*` }
    ];

    const results = [];
    for (const query of searchQueries) {
      try {
        const matches = await this.findRecords(query, 'Names_API');
        results.push(...matches);
      } catch (err) {
        console.warn('Search query failed:', query, err.message);
      }
    }

    // Remove duplicates based on ID
    const uniqueResults = results.filter((record, index, self) => 
      index === self.findIndex(r => r.fieldData.ID === record.fieldData.ID)
    );

    return uniqueResults;
  }

  async logout() {
    if (this.token) {
      await fetch(`${this.baseUrl}/fmi/data/v1/databases/${this.database}/sessions/${this.token}`, {
        method: 'DELETE'
      });
      this.token = null;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = FileMakerQuiltClient;
```

### Data Synchronization Script for FileMaker
```javascript
// scripts/sync-filemaker-quilt.js
const FileMakerQuiltClient = require('../lib/filemaker-client');
const fs = require('fs').promises;
const path = require('path');

class FileMakerQuiltSync {
  constructor() {
    this.client = new FileMakerQuiltClient();
    this.cacheDir = './data/quilt-cache';
    this.lastSyncFile = path.join(this.cacheDir, 'last-sync.json');
  }

  async syncAllData(forceFullSync = false) {
    console.log('🔄 Starting FileMaker QuAIDS Quilt data sync...');
    
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      const lastSync = await this.getLastSyncTime();
      const isFullSync = forceFullSync || !lastSync;
      
      if (isFullSync) {
        console.log('📋 Performing full sync...');
        await this.fullSync();
      } else {
        console.log('🔄 Performing incremental sync...');
        await this.incrementalSync(lastSync);
      }
      
      await this.updateLastSyncTime();
      console.log('✅ FileMaker sync complete!');
      
    } catch (error) {
      console.error('❌ FileMaker sync failed:', error);
      throw error;
    } finally {
      await this.client.logout();
    }
  }

  async fullSync() {
    // Get all names
    const names = await this.client.getAllNames();
    await this.saveToCache('names-master.json', names);
    
    // Organize names by first letter for search
    const namesByLetter = this.organizeNamesByLetter(names);
    await this.saveToCache('names-by-letter.json', namesByLetter);
    
    // Get all blocks
    const blocks = await this.client.getAllBlocks();
    await this.saveToCache('blocks-master.json', blocks);
    
    // Create block-to-names mapping
    const blockNameMap = this.createBlockNameMapping(names);
    await this.saveToCache('block-name-mapping.json', blockNameMap);
    
    // Generate search indexes
    await this.generateSearchIndexes(names, blocks);
    
    console.log(`📊 Full sync complete: ${names.length} names, ${blocks.length} blocks`);
  }

  async incrementalSync(lastSyncTime) {
    // FileMaker modification timestamp query
    const modifiedSince = new Date(lastSyncTime).toISOString();
    
    // Get recently modified names
    const modifiedNames = await this.client.findRecords({
      'Modification_Timestamp': `>=${modifiedSince}`
    }, 'Names_API');
    
    if (modifiedNames.length > 0) {
      console.log(`🔄 Found ${modifiedNames.length} modified names`);
      
      // Update existing cache
      const existingNames = await this.loadFromCache('names-master.json');
      const updatedNames = this.mergeUpdates(existingNames, modifiedNames);
      
      await this.saveToCache('names-master.json', updatedNames);
      await this.updateDerivedData(updatedNames);
    }
    
    // Get recently modified blocks
    const modifiedBlocks = await this.client.findRecords({
      'Modification_Timestamp': `>=${modifiedSince}`
    }, 'Blocks_API');
    
    if (modifiedBlocks.length > 0) {
      console.log(`🔄 Found ${modifiedBlocks.length} modified blocks`);
      
      const existingBlocks = await this.loadFromCache('blocks-master.json');
      const updatedBlocks = this.mergeUpdates(existingBlocks, modifiedBlocks);
      
      await this.saveToCache('blocks-master.json', updatedBlocks);
    }
  }

  organizeNamesByLetter(names) {
    const organized = {};
    
    names.forEach(name => {
      const firstLetter = (name.firstName?.[0] || name.lastName?.[0] || '#').toUpperCase();
      if (!organized[firstLetter]) {
        organized[firstLetter] = [];
      }
      organized[firstLetter].push(name);
    });
    
    // Sort within each letter group
    Object.keys(organized).forEach(letter => {
      organized[letter].sort((a, b) => {
        const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
        const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
        return aName.localeCompare(bName);
      });
    });
    
    return organized;
  }

  createBlockNameMapping(names) {
    const mapping = {};
    
    names.forEach(name => {
      if (!mapping[name.blockId]) {
        mapping[name.blockId] = [];
      }
      mapping[name.blockId].push({
        id: name.id,
        fullName: name.fullName,
        coordinates: name.coordinates
      });
    });
    
    return mapping;
  }

  async generateSearchIndexes(names, blocks) {
    // Create searchable index for fuzzy matching
    const searchIndex = {
      names: names.map(name => ({
        id: name.id,
        searchTerms: [
          name.firstName?.toLowerCase(),
          name.lastName?.toLowerCase(),
          name.fullName?.toLowerCase(),
          // Add phonetic variations if needed
          this.soundex(name.firstName),
          this.soundex(name.lastName)
        ].filter(Boolean),
        blockId: name.blockId
      })),
      blocks: blocks.map(block => ({
        id: block.id,
        searchTerms: [
          block.title?.toLowerCase(),
          block.description?.toLowerCase()
        ].filter(Boolean)
      }))
    };
    
    await this.saveToCache('search-index.json', searchIndex);
  }

  // Simple Soundex implementation for phonetic matching
  soundex(word) {
    if (!word) return '';
    
    const soundexMap = {
      'B': '1', 'F': '1', 'P': '1', 'V': '1',
      'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
      'D': '3', 'T': '3',
      'L': '4',
      'M': '5', 'N': '5',
      'R': '6'
    };
    
    const upper = word.toUpperCase();
    let soundex = upper[0];
    
    for (let i = 1; i < upper.length && soundex.length < 4; i++) {
      const code = soundexMap[upper[i]];
      if (code && code !== soundex[soundex.length - 1]) {
        soundex += code;
      }
    }
    
    return soundex.padEnd(4, '0');
  }

  async saveToCache(filename, data) {
    const filepath = path.join(this.cacheDir, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async loadFromCache(filename) {
    try {
      const filepath = path.join(this.cacheDir, filename);
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return null;
    }
  }

  async getLastSyncTime() {
    try {
      const syncData = await this.loadFromCache('last-sync.json');
      return syncData?.timestamp;
    } catch (err) {
      return null;
    }
  }

  async updateLastSyncTime() {
    await this.saveToCache('last-sync.json', {
      timestamp: new Date().toISOString(),
      version: '1.0'
    });
  }

  mergeUpdates(existing, updates) {
    const existingMap = new Map(existing.map(item => [item.id, item]));
    
    updates.forEach(update => {
      existingMap.set(update.fieldData.ID, this.transformFileMakerRecord(update));
    });
    
    return Array.from(existingMap.values());
  }

  transformFileMakerRecord(fmRecord) {
    // Transform FileMaker record format to our standard format
    return {
      id: fmRecord.fieldData.ID,
      firstName: fmRecord.fieldData.First_Name,
      lastName: fmRecord.fieldData.Last_Name,
      fullName: fmRecord.fieldData.Full_Name,
      blockId: fmRecord.fieldData.Block_ID,
      coordinates: {
        x: fmRecord.fieldData.X_Coordinate,
        y: fmRecord.fieldData.Y_Coordinate,
        width: fmRecord.fieldData.Width,
        height: fmRecord.fieldData.Height
      },
      lastModified: fmRecord.modificationTimestamp
    };
  }
}

// CLI usage
if (require.main === module) {
  const sync = new FileMakerQuiltSync();
  const forceFullSync = process.argv.includes('--full');
  
  sync.syncAllData(forceFullSync)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Sync failed:', err);
      process.exit(1);
    });
}

module.exports = FileMakerQuiltSync;
```

### FileMaker Web Viewer Integration
```javascript
// lib/filemaker-web-viewer.js
class FileMakerWebViewer {
  constructor(database, layout) {
    this.baseUrl = 'https://aidsquilt.360works.com';
    this.database = database;
    this.layout = layout;
  }

  // Generate URLs for FileMaker Web Viewer
  getBlockViewerUrl(blockId, highlightName = null) {
    const params = new URLSearchParams({
      database: this.database,
      layout: 'Block_Viewer',
      'Block_ID': blockId
    });

    if (highlightName) {
      params.append('highlight', highlightName);
    }

    return `${this.baseUrl}/fmi/webd/${this.database}?${params}`;
  }

  // Generate direct image URLs from FileMaker container fields
  getBlockImageUrl(blockId, imageField = 'Block_Image') {
    return `${this.baseUrl}/fmi/xml/cnt/data.gif?-db=${this.database}&-lay=Blocks&-recid=${blockId}&-field=${imageField}`;
  }

  // Get deep zoom tile URL for high-resolution viewing
  getDeepZoomUrl(blockId) {
    return `${this.baseUrl}/fmi/webd/Deep_Zoom_Viewer?blockId=${blockId}`;
  }

  // Embed FileMaker Web Viewer in iframe
  generateEmbedCode(blockId, width = '100%', height = '600px') {
    const viewerUrl = this.getBlockViewerUrl(blockId);
    
    return `
      <iframe 
        src="${viewerUrl}"
        width="${width}"
        height="${height}"
        frameborder="0"
        allowfullscreen
        style="border: 1px solid #ccc; border-radius: 4px;"
      ></iframe>
    `;
  }
}

module.exports = FileMakerWebViewer;
```

### Scheduled Sync with FileMaker
```javascript
// scripts/filemaker-sync-schedule.js
const cron = require('node-cron');
const FileMakerQuiltSync = require('./sync-filemaker-quilt');

console.log('📅 Starting FileMaker sync scheduler...');

// Incremental sync every hour during business hours
cron.schedule('0 9-17 * * 1-5', async () => {
  console.log('🔄 Starting hourly incremental sync...');
  
  const sync = new FileMakerQuiltSync();
  try {
    await sync.syncAllData(false); // Incremental sync
    console.log('✅ Hourly sync complete');
  } catch (error) {
    console.error('❌ Hourly sync failed:', error);
  }
});

// Full sync every night at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🌙 Starting nightly full sync...');
  
  const sync = new FileMakerQuiltSync();
  try {
    await sync.syncAllData(true); // Full sync
    console.log('✅ Nightly full sync complete');
  } catch (error) {
    console.error('❌ Nightly sync failed:', error);
  }
});

console.log('⏰ FileMaker sync scheduler started');
console.log('   - Incremental sync: Every hour, 9 AM - 5 PM, Mon-Fri');
console.log('   - Full sync: Every night at 2 AM');
```

### FileMaker-Specific Considerations

#### **Authentication & Security**
- FileMaker requires specific user account with API privileges
- Session tokens expire after 15 minutes of inactivity
- Rate limiting: ~100 requests per minute recommended
- SSL/HTTPS required for external access

#### **Data Field Mapping**
```javascript
// Expected FileMaker field names (adjust based on actual schema)
const FILEMAKER_FIELDS = {
  names: {
    id: 'ID',
    firstName: 'First_Name',
    lastName: 'Last_Name', 
    fullName: 'Full_Name',
    blockId: 'Block_ID',
    xCoord: 'X_Coordinate',
    yCoord: 'Y_Coordinate',
    width: 'Width',
    height: 'Height'
  },
  blocks: {
    id: 'Block_ID',
    title: 'Block_Title',
    imageContainer: 'Block_Image',
    thumbnailContainer: 'Thumbnail_Image'
  }
};
```

#### **Performance Optimization**
- Cache FileMaker data locally to reduce API calls
- Use FileMaker's modification timestamps for incremental sync
- Implement connection pooling for multiple concurrent requests
- Consider FileMaker's concurrent user licensing limits

## 🔍 OpenSeaDragon Block Viewer Integration

### Interactive Name-to-Block Linking System

```typescript
// components/QuiltBlockViewer.tsx
import OpenSeaDragon from 'openseadragon';
import { useEffect, useRef, useState } from 'react';

interface QuiltBlock {
  id: string;
  imageUrl: string;
  deepZoomUrl: string;
  names: Array<{
    id: string;
    name: string;
    coordinates: { x: number; y: number; width: number; height: number };
  }>;
}

export function QuiltBlockViewer({ blockId, highlightName }: { blockId: string; highlightName?: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [blockData, setBlockData] = useState<QuiltBlock | null>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    const osdViewer = OpenSeaDragon({
      element: viewerRef.current,
      prefixUrl: '/openseadragon/images/',
      tileSources: {
        type: 'image',
        url: blockData?.deepZoomUrl || blockData?.imageUrl
      },
      showNavigationControl: true,
      showZoomControl: true,
      showHomeControl: true,
      showFullPageControl: true,
      gestureSettingsTouch: {
        pinchRotate: true
      }
    });

    setViewer(osdViewer);

    return () => {
      osdViewer.destroy();
    };
  }, [blockData]);

  // Add name highlighting overlay
  useEffect(() => {
    if (!viewer || !blockData || !highlightName) return;

    const nameData = blockData.names.find(n => 
      n.name.toLowerCase().includes(highlightName.toLowerCase())
    );

    if (nameData) {
      // Add highlight overlay
      const overlay = document.createElement('div');
      overlay.className = 'name-highlight';
      overlay.style.cssText = `
        border: 3px solid #ff6b6b;
        background: rgba(255, 107, 107, 0.2);
        pointer-events: none;
      `;

      viewer.addOverlay({
        element: overlay,
        location: new OpenSeaDragon.Rect(
          nameData.coordinates.x,
          nameData.coordinates.y,
          nameData.coordinates.width,
          nameData.coordinates.height
        )
      });

      // Zoom to the highlighted name
      viewer.viewport.fitBounds(
        new OpenSeaDragon.Rect(
          nameData.coordinates.x - 0.1,
          nameData.coordinates.y - 0.1,
          nameData.coordinates.width + 0.2,
          nameData.coordinates.height + 0.2
        )
      );
    }
  }, [viewer, blockData, highlightName]);

  return (
    <div className="quilt-block-viewer">
      <div ref={viewerRef} style={{ width: '100%', height: '600px' }} />
      
      {blockData && (
        <div className="block-info">
          <h3>Block #{blockData.id}</h3>
          <p>{blockData.names.length} names on this block</p>
          
          {/* Name list with click-to-highlight */}
          <div className="names-list">
            {blockData.names.map(name => (
              <button
                key={name.id}
                onClick={() => highlightNameOnBlock(name.name)}
                className={`name-button ${highlightName === name.name ? 'active' : ''}`}
              >
                {name.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Name-to-Block Lookup API
```typescript
// pages/api/quilt/lookup.ts
import { getCachedQuiltData } from '@/lib/quilt-cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name, type = 'name' } = req.query;

  try {
    const quiltData = await getCachedQuiltData();
    
    if (type === 'name') {
      // Find which block(s) contain this name
      const results = quiltData.findBlocksByName(name as string);
      
      res.json({
        name,
        blocks: results.map(result => ({
          blockId: result.block.id,
          coordinates: result.coordinates,
          imageUrl: result.block.imageUrl,
          deepZoomUrl: result.block.deepZoomUrl,
          viewerUrl: `/quilt/block/${result.block.id}?highlight=${encodeURIComponent(name as string)}`
        }))
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup quilt data' });
  }
}
```

### Interactive Name Links Component
```typescript
// components/InteractiveNameLink.tsx
interface InteractiveNameLinkProps {
  name: string;
  children: React.ReactNode;
  showPreview?: boolean;
}

export function InteractiveNameLink({ name, children, showPreview = true }: InteractiveNameLinkProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [blockData, setBlockData] = useState(null);

  const handleNameClick = async () => {
    // Fetch block information for this name
    const response = await fetch(`/api/quilt/lookup?name=${encodeURIComponent(name)}`);
    const data = await response.json();
    
    if (data.blocks?.length > 0) {
      setBlockData(data.blocks[0]); // Show first block if multiple
      setShowPopup(true);
    }
  };

  return (
    <>
      <span 
        className="interactive-name-link"
        onClick={handleNameClick}
        style={{ 
          cursor: 'pointer', 
          color: '#007bff',
          textDecoration: 'underline',
          position: 'relative'
        }}
        onMouseEnter={() => showPreview && loadPreview()}
      >
        {children}
      </span>

      {/* Popup block viewer */}
      {showPopup && blockData && (
        <Modal onClose={() => setShowPopup(false)}>
          <QuiltBlockViewer 
            blockId={blockData.blockId} 
            highlightName={name}
          />
          
          <div className="popup-actions">
            <Button onClick={() => window.open(blockData.viewerUrl, '_blank')}>
              View Full Block
            </Button>
            <Button onClick={() => setShowPopup(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
```

## 📋 Implementation Roadmap

### Phase 1: Core Enhancements (4-6 weeks)
1. **Exhibition Playback System** - Essential for public display
2. **Audio Processing Pipeline** - Quality and consistency improvements
3. **AWS Deployment Setup** - Production infrastructure

### Phase 2: Data Integration (3-4 weeks)
1. **AIDS Quilt Data Caching** - Build comprehensive local cache
2. **OpenSeaDragon Integration** - Interactive block viewing
3. **Name-to-Block Linking** - Connect recordings to quilt locations

### Phase 3: Advanced Features (4-6 weeks)
1. **Advanced Analytics Dashboard** - Detailed insights and reporting
2. **Bulk Operations Interface** - Administrative efficiency tools
3. **Mobile App Considerations** - React Native or PWA approach

### Phase 4: Scale and Polish (2-3 weeks)
1. **Performance Optimization** - Database indexing, caching, CDN
2. **Security Hardening** - Penetration testing, vulnerability assessment
3. **User Experience Polish** - Accessibility, responsive design, animations

---

**Total Estimated Timeline: 13-19 weeks**

Each phase builds on the previous one, ensuring the platform remains functional and deployable throughout development. The modular architecture we've established makes this roadmap achievable and allows for flexible prioritization based on exhibition deadlines and user feedback.

Perfect! Now you have a comprehensive recording validation system with:
Immediate Implementation (Active Now):
✅ Duration Validation:

2-5 seconds per name (configurable)
Rejects recordings outside this range
Provides detailed feedback

✅ File Validation:

File type and size checks
Audio duration extraction
Metadata validation

✅ User Feedback:

Clear error messages
Visual progress indicators
Detailed metrics display

Future Enhancements (Stubbed):
🔄 Audio Quality Analysis (Ready to implement):

Loudness analysis using Web Audio API
Distortion detection
Signal quality metrics

🔄 Silence Gap Detection (Ready to implement):

Detect pauses between names
Validate appropriate spacing
Check for consistent pacing

🔄 Speech Recognition (Ready to implement):

Verify spoken names match expected
Count actual spoken names
Check pronunciation quality

How It Works:

Upload/Record: User submits audio file
Validation: System checks duration against name count
Feedback: User gets immediate validation results
Storage: Only valid recordings are accepted (or flagged for review)

Configuration:
The time constraints are now configurable in CONFIG.RECORDING:

MIN_DURATION_PER_NAME: 2 seconds
MAX_DURATION_PER_NAME: 5 seconds

You can adjust these values as needed. The system will automatically calculate expected durations based on the number of names in each page.
This ensures recording quality while being ready to expand with more sophisticated audio analysis in the future!