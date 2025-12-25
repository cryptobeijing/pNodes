/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  // Disable strict mode for compatibility with leaflet
  reactStrictMode: false,
};

module.exports = nextConfig;
