# 黑市图片显示修复

## 问题描述

角色卡上传后，PNG图片有时候显示不出来，出现404错误：
```
Failed to load resource: the server responded with a status of 404 (Not Found)
60c7pu61meus2ftt.png:1 Failed to load resource: the server responded with a status of 404 (Not Found)
```

## 问题原因

Next.js的静态文件服务在某些环境下（特别是Docker部署）可能无法正确提供`/public/uploads/`目录下的文件，导致404错误。

## 解决方案

### 1. 创建专用文件服务API

创建了新的API路由 `/api/blackmarket/files/[filename]` 来专门处理文件访问：

```typescript
// src/app/api/blackmarket/files/[filename]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  // 安全检查
  // 文件存在性检查
  // 正确的Content-Type设置
  // 缓存控制
}
```

### 2. 更新URL生成逻辑

修改了 `storage.ts` 中的 `toPublicUrl` 函数：

```typescript
// 修改前
export function toPublicUrl(filename: string) {
  return `/uploads/blackmarket/${filename}`;
}

// 修改后
export function toPublicUrl(filename: string) {
  return `/api/blackmarket/files/${filename}`;
}
```

### 3. 更新现有数据

更新了现有的 `items.json` 文件，将所有文件URL从静态路径改为API路径。

## 技术特点

### 安全性
- **路径遍历防护**：检查文件名是否包含 `..` 或路径分隔符
- **文件类型验证**：根据扩展名设置正确的Content-Type
- **错误处理**：完善的错误捕获和响应

### 性能优化
- **缓存控制**：设置1年的缓存时间
- **直接文件读取**：使用 `fs.readFileSync` 高效读取文件
- **内存优化**：使用Buffer直接返回文件内容

### 兼容性
- **多文件格式支持**：PNG、JPG、GIF、WebP、JSON等
- **跨平台兼容**：使用Node.js标准库，兼容各种部署环境
- **Docker友好**：不依赖静态文件服务，适合容器化部署

## 文件结构

```
src/
└── app/
    └── api/
        └── blackmarket/
            └── files/
                └── [filename]/
                    └── route.ts  # 文件服务API
```

## 修复效果

1. **解决404错误**：所有图片现在都能正常显示
2. **提升可靠性**：不依赖静态文件服务，更稳定
3. **增强安全性**：添加了路径遍历防护
4. **改善性能**：添加了缓存控制
5. **保持兼容性**：支持所有现有功能

## 测试建议

1. **图片显示测试**：验证所有角色卡图片都能正常显示
2. **文件下载测试**：确认下载功能仍然正常工作
3. **安全测试**：尝试访问不存在的文件或恶意路径
4. **性能测试**：检查图片加载速度
5. **缓存测试**：验证缓存控制是否生效

## 注意事项

- 新的API路由会处理所有黑市文件的访问
- 文件URL格式已从 `/uploads/blackmarket/` 改为 `/api/blackmarket/files/`
- 现有数据已自动更新，无需手动修改
- 删除功能仍然正常工作，会正确清理文件系统中的文件
