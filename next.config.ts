import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['jspdf', 'jspdf-autotable'],
  turbopack: {
    resolveAlias: {
      'fflate': 'fflate/esm/browser.js',
    },
  },
};

export default nextConfig;
