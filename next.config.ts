import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
      },
      {
        protocol: "https",
        hostname: "image.rakuten.co.jp",
      },
      {
        protocol: "https",
        hostname: "*.rakuten.co.jp",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
    ],
  },
};

export default nextConfig;
