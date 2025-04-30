/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove standalone output mode to avoid the file copying issue
  // output: 'standalone',
  images: {
    domains: ['example.com'], // Add any domains you need for images
    unoptimized: true, // Add this to fix image optimization issues
  },
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
  // Explicitly exclude the (main) route group
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Disable static optimization for problematic routes
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Disable the build ID generation to avoid issues with file paths
  generateBuildId: async () => {
    return 'build-id-static';
  },
};

module.exports = nextConfig;
