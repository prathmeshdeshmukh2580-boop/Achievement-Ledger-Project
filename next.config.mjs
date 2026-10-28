/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/platform',
        destination: '/platforms',
        permanent: true,
      },
      {
        source: '/platform-stats',
        destination: '/platforms',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
