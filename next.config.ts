import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用输出文件跟踪，用于Docker部署
  output: 'standalone',
  
  // 实验性功能
  experimental: {
    // 启用App Router
    appDir: true,
  },
  
  // 服务器配置
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  
  // 图片优化配置
  images: {
    unoptimized: true, // Docker环境中禁用图片优化
  },
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/health',
        destination: '/api/health',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
