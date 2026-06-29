import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@narrative-ai/graph-schema", "@narrative-ai/narrative-engine"],
  allowedDevOrigins: ["192.168.32.111"],
}

export default nextConfig
