/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['example.com'], // Add any domains you need for images
  },
};

module.exports = nextConfig;
