/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  // Exclude packages with native modules from bundling
  serverComponentsExternalPackages: ['ssh2'],
  // Exclude native modules from webpack bundling
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark ssh2 as external to prevent webpack from bundling it
      // This prevents webpack from trying to parse the native .node modules
      // The package will be available at runtime from node_modules
      config.externals = config.externals || []
      config.externals.push('ssh2')
    }
    return config
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig

