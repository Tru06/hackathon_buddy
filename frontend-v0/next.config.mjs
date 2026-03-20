/** @type {import('next').NextConfig} */
// Build version: 5 - Clean deployment
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Force clean rebuild
  generateBuildId: async () => {
    return 'build-v5-' + Date.now()
  },
}

export default nextConfig
