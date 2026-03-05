import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Turbopack 호환: 빈 설정 추가하여 webpack-only 오류 방지
  turbopack: {},
};

export default withPWA(nextConfig);
