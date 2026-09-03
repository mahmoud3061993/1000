/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/spend/masaref.apk",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
          { key: "Content-Disposition", value: 'attachment; filename="masaref.apk"' },
        ],
      },
      {
        source: "/masaref-html.zip",
        headers: [
          { key: "Content-Type", value: "application/zip" },
          { key: "Content-Disposition", value: 'attachment; filename="masaref-html.zip"' },
        ],
      },
      {
        source: "/spend/masaref-html.zip",
        headers: [
          { key: "Content-Type", value: "application/zip" },
          { key: "Content-Disposition", value: 'attachment; filename="masaref-html.zip"' },
        ],
      },
      {
        source: "/spend/masaref-android.zip",
        headers: [
          { key: "Content-Type", value: "application/zip" },
          { key: "Content-Disposition", value: 'attachment; filename="masaref-android.zip"' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/car", destination: "/car/index.html" },
      { source: "/car/", destination: "/car/index.html" },
      { source: "/car/index.html", destination: "/car/index.html" },
      { source: "/spend", destination: "/spend/index.html" },
      { source: "/spend/", destination: "/spend/index.html" },
      { source: "/spend/index.html", destination: "/spend/index.html" },
      { source: "/products/plant", destination: "/products/plant/index.html" },
      { source: "/products/plant/", destination: "/products/plant/index.html" },
    ];
  },
  outputFileTracingIncludes: {
    "/download/masaref-html": ["./public/masaref-html.zip", "./public/spend/masaref-html.zip"],
  },
};

module.exports = nextConfig;
