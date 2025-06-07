/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
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
    domains: ['localhost'],
    // Add your Lightsail domain later: ['your-domain.com']
  },
  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    maxUploadSize: '50mb',
  },
}

module.exports = nextConfig