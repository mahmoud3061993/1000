/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/products/:id", destination: "/" }];
  },
};

module.exports = nextConfig;
