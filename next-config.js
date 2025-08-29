/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Base path for Apache proxy setup
  basePath: process.env.NODE_ENV === 'production' ? '/readmyname' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/readmyname' : '',
  
  // Audio file upload configuration
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Adjust based on expected audio file sizes
    },
  },
  
  // For AWS Lightsail deployment
  output: 'standalone',
  
  // Image domains for user avatars if needed
  images: {
    domains: ['localhost', 'www.aidsquilttouch.org', 'staging.aidsquilttouch.org'],
    unoptimized: true, // Disable image optimization for Apache serving
  },
  
  // Trailing slash for Apache compatibility
  trailingSlash: true,
  
  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  
  // Headers for Apache proxy
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
}

module.exports = nextConfig

