/** @type {import('next').NextConfig} */
// Build version: 6 - Force clean rebuild
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
  generateBuildId: async () => {
    return 'build-v6-' + Date.now()
  },
}

export default nextConfig
