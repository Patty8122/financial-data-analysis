/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/ticker_info/:path*',
        destination: 'http://localhost:8000/ticker_info/:path*',
      },
      {
        source: '/text_search',
        destination: 'http://localhost:8000/text_search',
      },
    ];
  },
};

module.exports = nextConfig; 