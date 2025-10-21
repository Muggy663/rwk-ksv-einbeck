/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,
  // Cache-Busting für PWA
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Komplett undici ignorieren
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('undici');
    }
    
    config.resolve.alias = {
      ...config.resolve.alias,
      undici: false,
    };
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      undici: false,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['undici'],
    esmExternals: false,
  },
  // PWA Cache-Busting
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
}

module.exports = nextConfig
