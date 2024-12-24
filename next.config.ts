/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/BrainShiftStudio',
  images: {
    unoptimized: true,
  },
  assetPrefix: '/BrainShiftStudio/',
  trailingSlash: true,
}

module.exports = nextConfig