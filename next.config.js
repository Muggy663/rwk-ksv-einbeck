/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Security Headers & Cache-Busting
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          }
        ]
      }
    ];
  },
  // Source Maps in Produktion deaktivieren
  productionBrowserSourceMaps: false,
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
  serverExternalPackages: ['undici'],
  turbopack: {},
  experimental: {
    optimizeCss: false,
  },
  compiler: {
    removeConsole: false,
  },
  // PWA Cache-Busting
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  // Preload-Warnungen reduzieren
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
