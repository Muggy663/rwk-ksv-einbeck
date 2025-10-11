/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: false,
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
}

module.exports = nextConfig
