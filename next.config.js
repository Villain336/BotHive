/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
};

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT || 'shipready',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: true,
  transpileClientSDK: true,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    disableServerWebpackPlugin: false,
    disableClientWebpackPlugin: false,
  },
  sentryWebpackPluginOptions
);
