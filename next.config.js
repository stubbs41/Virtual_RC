/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use export output for static deployment
  // Comment this out for server-side rendering
  // output: 'export',

  // For server-side rendering with standalone mode
  // Uncomment this for server deployment
  // output: 'standalone',

  images: {
    domains: ['example.com'], // Add any domains you need for images
    unoptimized: true, // Required for static export
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
  // Use a static build ID to avoid issues with file paths
  generateBuildId: async () => {
    return 'build-id-static';
  },
  // Disable the problematic route group
  transpilePackages: ['next-auth'],
};

module.exports = nextConfig;
