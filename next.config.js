/** @type {import('next').NextConfig} */
const isCapacitor = process.env.NEXT_CONFIG === 'capacitor';

const nextConfig = {
  /* config options here */
  ...(isCapacitor && {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true }
  }),
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
  // Aktiviere den Webpack Build Worker
  experimental: {
    webpackBuildWorker: true
  }
};

// Sentry Configuration
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig,
  {
    org: "ksv-einbeck",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: true,
    sourcemaps: {
      disable: false,
      deleteSourcemapsAfterUpload: true,
    },
    hideSourceMaps: true,
  }
);
