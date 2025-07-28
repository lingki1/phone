# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
# 检查 https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine 了解为什么需要 libc6-compat
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制package文件
COPY package.json package-lock.json* ./
# 安装所有依赖（包括开发依赖）
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# 如果使用自定义用户，取消注释下面的行
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public

# 设置正确的权限
RUN mkdir .next
RUN chown node:node .next

# 自动利用输出跟踪来复制必要的文件
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 服务器已经构建，使用 node 来运行它
CMD ["node", "server.js"] 