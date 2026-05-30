import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Keep already-visited dynamic pages in the client Router Cache so that
  // back/forward and re-navigations feel instant instead of refetching.
  // `dynamic` applies to default-prefetch <Link>s, `static` to prefetch={true}.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons**",
      },
      {
        protocol: "https",
        hostname: "media1.giphy.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
