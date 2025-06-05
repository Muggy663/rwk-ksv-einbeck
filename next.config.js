/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Lösung für das undici-Problem mit privaten Klassenfeldern
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      undici: false, // Deaktiviert undici und verwendet den Node.js-Fetch
    };
    return config;
  },
  // Favicon-Konfiguration
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;