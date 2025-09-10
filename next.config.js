/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['i.ytimg.com', 'img.youtube.com'],
  }
}

module.exports = nextConfig
