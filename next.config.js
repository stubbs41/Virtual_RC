/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // For Vercel deployment, use standalone output
  output: 'standalone',

  images: {
    domains: ['example.com'], // Add any domains you need for images
    unoptimized: true, // Required for static export
  },

  // Simplify the configuration for Vercel deployment
  transpilePackages: ['next-auth'],

  // Ensure API routes work correctly
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      }
    ];
  },

  // Ensure proper error handling
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
