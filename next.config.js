/** @type {import('next').NextConfig} */
const plantOrigin = (process.env.PLANT_APP_ORIGIN || "").replace(/\/$/, "");

const nextConfig = {
  async rewrites() {
    if (!plantOrigin) return [];
    return [
      { source: "/products/plant", destination: `${plantOrigin}/products/plant` },
      { source: "/products/plant/:path*", destination: `${plantOrigin}/products/plant/:path*` },
    ];
  },
};

module.exports = nextConfig;
