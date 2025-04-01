/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Configure routes that use cookies or dynamic content
  // so they don't trigger static generation errors
  reactStrictMode: true,
};

export default nextConfig;
