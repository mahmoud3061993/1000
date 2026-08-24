/** @type {import('next').NextConfig} */
const plantOrigin = (process.env.PLANT_APP_ORIGIN || "").replace(/\/$/, "");

const nextConfig = {
  async rewrites() {
    const list = [
      { source: "/car", destination: "/car/index.html" },
      { source: "/car/", destination: "/car/index.html" },
    ];
    if (plantOrigin) {
      list.push(
        { source: "/products/plant", destination: `${plantOrigin}/products/plant` },
        { source: "/products/plant/:path*", destination: `${plantOrigin}/products/plant/:path*` }
      );
    }
    return list;
  },
};

module.exports = nextConfig;
