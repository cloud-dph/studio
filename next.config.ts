import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      { // Add Hotstar domain
        protocol: 'https',
        hostname: 'img1.hotstarext.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
