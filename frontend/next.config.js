/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
      {
        source: '/qna_search',
        destination: 'http://localhost:8000/qna_search',
      },
      {
        source: '/refresh',
        destination: 'http://localhost:8000/refresh',
      },
      {
        source: '/add_ticker_to_db',
        destination: 'http://localhost:8000/add_ticker_to_db',
      },
      
    ];
  },
};

module.exports = nextConfig; 