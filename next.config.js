/** @type {import('next').NextConfig} */
const plantOrigin = (process.env.PLANT_APP_ORIGIN || "").replace(/\/$/, "");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/spend/masaref.apk",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: 'attachment; filename="masaref.apk"' },
        ],
      },
    ];
  },
  async rewrites() {
    const list = [
      { source: "/car", destination: "/car/index.html" },
      { source: "/car/", destination: "/car/index.html" },
      { source: "/car/index.html", destination: "/car/index.html" },
      { source: "/spend", destination: "/spend/index.html" },
      { source: "/spend/", destination: "/spend/index.html" },
      { source: "/spend/index.html", destination: "/spend/index.html" },
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
