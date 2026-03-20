/** @type {import('next').NextConfig} */
// Build version: 4 - Force cache invalidation
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force clean rebuild
  generateBuildId: async () => {
    return 'build-v4-' + Date.now()
  },
}

export default nextConfig
