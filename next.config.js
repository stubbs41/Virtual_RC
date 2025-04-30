/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['example.com'], // Add any domains you need for images
    unoptimized: true, // Add this to fix image optimization issues
  },
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
};

module.exports = nextConfig;
