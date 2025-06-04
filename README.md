# Community Audio Recording Project

A web application for managing community-sourced audio recordings of community members reading pages of names.

## Features

- **Profile Management** - User registration and profile editing
- **Live Recording** - In-browser audio recording with real-time name display
- **Offline Contribution** - PDF download and audio file upload workflow
- **Management Dashboard** - Administrative tools for project oversight
- **Playback System** - Audio playback for community recordings
- **Exhibition Mode** - Queue management for displaying 5000+ recordings

## Tech Stack

- **Frontend**: Next.js 14, Material-UI, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **File Storage**: Local/AWS S3
- **Email**: AWS SES
- **SMS**: AWS SNS
- **Deployment**: AWS Lightsail

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- AWS account (for production deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd community-audio-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
community-audio-app/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── lib/                # Utility functions and configurations
├── prisma/             # Database schema and migrations
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── public/             # Static assets
```

## User Modes

1. **Profile Setup** - User registration and profile management
2. **Live Recording** - Real-time audio recording with name display
3. **Offline Contribution** - Download PDFs, upload audio files
4. **Management** - Administrative dashboard and tools
5. **Playback** - Community recording playback interface
6. **Observer** - Public view of project progress

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Database

This project uses Prisma with PostgreSQL. Run migrations:

```bash
npx prisma migrate dev
```

View the database:

```bash
npx prisma studio
```

## Deployment

### AWS Lightsail

1. Set up Lightsail instance with Node.js
2. Configure PostgreSQL database
3. Set up AWS SES for email notifications
4. Configure environment variables
5. Deploy using PM2 or Docker

Detailed deployment instructions: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support, please open an issue on GitHub.