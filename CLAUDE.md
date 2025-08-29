# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint linting
- `npm run type-check` - Run TypeScript compiler checks

### Database Management
- `npm run db:studio` - Open Prisma Studio for database GUI
- `npm run db:inspect` - Open SQLite database directly with sqlite3
- `npm run db:backup` - Backup SQLite database to dev.db.backup
- `npm run seed` - Seed database with sample data
- `npm run seed:reset` - Reset database and reseed (DESTRUCTIVE)

### Key Development Files
- Database: `prisma/dev.db` (SQLite)
- Database Schema: `prisma/schema.prisma`
- Environment: Copy `env-example.sh` and configure as `.env.local`
- PM2 Config: `ecosystem.config.js` for production deployment

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Database**: SQLite with Prisma ORM (PostgreSQL for production)
- **Authentication**: NextAuth.js with credentials provider
- **UI**: Material-UI + Tailwind CSS
- **Deployment**: AWS Lightsail with PM2

### Database Schema
The application uses 7 main models:
1. **User** - Authentication and role management (CONTRIBUTOR|MANAGER|OBSERVER|ADMIN|GALLERIST)
2. **NameList** - Pages containing names to be recorded (JSON format with metadata support)
3. **Recording** - Audio files with validation, status tracking, and QA
4. **Exhibition** - Gallery display configurations with scheduling
5. **ExhibitionPSA** - Public service announcement audio files
6. **ExhibitionQueueItem** - Ordered exhibition playback queue
7. **ExhibitionPlaybackLog** - Exhibition playback analytics

### Core Application Flows

#### 1. Name Management System
- **PageManager** (`lib/pageManager.ts`) handles creation/management of name lists
- Names stored as JSON with metadata: `{ name: string, artifactNumber?: string, blockNumber?: string }`
- Supports both legacy string arrays and new metadata format
- Page-based organization for manageable recording sessions

#### 2. Audio Recording Pipeline
- **Live Recording**: Browser-based recording with real-time validation
- **Upload Recording**: File upload with comprehensive validation
- **Quality Assurance**: Duration, file type, and audio analysis
- **Status Workflow**: PENDING → APPROVED/REJECTED with admin oversight

#### 3. Exhibition System
- **Queue Management**: Ordered playback for gallery exhibitions
- **PSA Integration**: Configurable public service announcements
- **Gallery Hours**: Scheduled exhibition operating hours
- **Analytics**: Comprehensive playback logging and statistics

### Key Library Files

#### Core Business Logic
- `lib/pageManager.ts` - Name list and page management
- `lib/auth.ts` - NextAuth configuration with role-based access
- `lib/config.ts` - Application constants and validation helpers
- `lib/prisma.ts` - Database client configuration

#### Audio Processing
- `lib/audioAnalysis.ts` - Audio quality analysis and validation
- `lib/audioQA.ts` - Quality assurance pipeline
- `lib/recordingvalidator.ts` - File validation and processing
- `lib/polyphonicPlayer.ts` - Advanced multichannel audio playback

### Component Architecture

#### Layout Components
- `components/layout/Header.tsx` - Main navigation with role-based menus
- `components/providers/` - Theme and authentication context providers

#### Feature Components
- `components/manage/` - Administrative management dashboard components
- `components/recordings/` - Recording management and playback
- `components/admin/` - System administration and user management
- `components/gallery/` - Exhibition and gallery display components

#### Custom Hooks
- `hooks/useManageData.ts` - Data management for admin dashboard
- `hooks/useExhibitionQueue.ts` - Exhibition queue state management
- `hooks/useAudioPlayer.ts` - Audio playback functionality
- `hooks/useRecordings.ts` - Recording data management

### API Routes Structure

#### Core APIs
- `/api/auth/` - NextAuth authentication endpoints
- `/api/recordings/` - Recording upload, validation, and management
- `/api/namelists/` - Name list CRUD operations
- `/api/pages/` - Page management and search

#### Administrative APIs  
- `/api/admin/recordings/` - Recording approval and management
- `/api/admin/users/` - User management and role assignment
- `/api/admin/stats/` - System statistics and analytics

#### Exhibition APIs
- `/api/exhibitions/` - Exhibition configuration and management
- Exhibition queue and playback logging endpoints

### Authentication & Authorization
- **Roles**: CONTRIBUTOR (record), MANAGER (approve), ADMIN (all access), OBSERVER (read-only), GALLERIST (exhibitions)
- **Session Strategy**: JWT with role information in token
- **Protection**: Page and API route protection via middleware
- **Registration**: Email-based with admin approval workflow

### File Storage
- **Local Development**: `uploads/` directory
- **Production**: AWS S3 or Lightsail Object Storage
- **Audio Formats**: MP3, WAV, M4A, OGG with size limits
- **File Processing**: Hash validation, corruption detection, metadata extraction

### Data Validation
- **Names per page**: 1-50 configurable limit
- **Recording duration**: 2-5 seconds per name (configurable)
- **File size limits**: 50MB maximum
- **Audio quality**: Loudness, distortion, and silence detection

## Development Guidelines

### Code Patterns
- Use TypeScript strictly throughout the application
- Follow Next.js App Router patterns for new pages
- Implement proper error boundaries and loading states
- Use Prisma for all database interactions
- Validate all user inputs with Zod or similar

### Database Operations
- Always use transactions for multi-table operations
- Include proper error handling for database failures
- Use Prisma's include/select for efficient queries
- Implement proper cascade delete relationships

### Audio Processing
- Validate audio files before processing
- Extract duration and metadata consistently  
- Implement graceful degradation for unsupported formats
- Use Web Audio API for client-side analysis

### Testing & Quality
- Run `npm run lint` and `npm run type-check` before commits
- Test audio upload and playback functionality thoroughly
- Verify role-based access control for new features
- Test database migrations with sample data

## Deployment Notes

### Production Environment
- **Platform**: AWS Lightsail with Ubuntu
- **Process Manager**: PM2 with ecosystem.config.js
- **Reverse Proxy**: Nginx for SSL and static file serving
- **Database**: PostgreSQL managed database
- **Storage**: Lightsail Object Storage for audio files

### Environment Variables Required
```bash
DATABASE_URL="postgresql://..." # PostgreSQL connection
NEXTAUTH_SECRET="..." # Authentication secret
NEXTAUTH_URL="https://domain.com" # Production URL
AWS_ACCESS_KEY_ID="..." # S3/Object Storage
AWS_SECRET_ACCESS_KEY="..." # S3/Object Storage  
AWS_REGION="us-east-1" # AWS region
AWS_S3_BUCKET="..." # Storage bucket name
```

### Migration from Development
1. Export SQLite data: Use Prisma migrate or custom export script
2. Import to PostgreSQL: Update DATABASE_URL and run migrations
3. Transfer audio files: Sync uploads/ to S3/Object Storage
4. Update file paths: Ensure storage URLs point to production location
5. Configure PM2: Use provided ecosystem.config.js for process management

## Special Considerations

### AIDS Memorial Quilt Integration
The application is designed to integrate with the AIDS Memorial Quilt database via FileMaker Pro APIs. Key integration points:
- Name lists can include `artifactNumber` and `blockNumber` metadata
- Support for linking names to quilt block positions
- OpenSeaDragon integration planned for block visualization
- FileMaker Data API compatibility for name/block lookups

### Exhibition Mode
- **Continuous Playback**: Auto-advance through approved recordings
- **Queue Management**: Position-based ordering with cycle tracking
- **PSA Integration**: Configurable announcement frequency
- **Gallery Hours**: Scheduled operation with time-based controls
- **Analytics**: Detailed playback logging for reporting

### Audio Quality System
Current implementation includes basic validation with extensible architecture for:
- **Duration Analysis**: Per-name timing validation
- **Quality Metrics**: Loudness, distortion, background noise detection  
- **Speech Recognition**: Name verification (planned)
- **Automatic Processing**: Silence trimming, normalization (planned)

### Scalability Considerations
- **Database Indexing**: Proper indexes on frequently queried fields
- **File Storage**: CDN integration for audio file delivery  
- **Caching**: Redis implementation for session and API caching
- **Load Balancing**: Multiple Lightsail instances with load balancer
- **Monitoring**: Application and infrastructure monitoring setup