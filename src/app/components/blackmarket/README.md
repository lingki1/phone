# 黑市功能

黑市是一个角色卡和世界书的分享平台，允许用户上传、浏览和下载角色卡与世界书文件。

## 功能特性

### 角色卡管理
- 支持 PNG 格式角色卡文件
- 自动解析角色卡中的元数据（服务端占位解析，便于后续替换为真实解析）
- 显示角色信息、性格设定、场景描述等
- 生成缩略图预览

### 世界书管理
- 支持 JSON 格式世界书文件
- 显示条目数量和主要内容
- 预览世界书结构和部分条目
- 支持主题标签分类

### 上传功能
- 拖拽上传或点击选择文件
- 智能识别文件类型（PNG/JSON）
- 自动提取元数据信息（可选）
- 支持添加描述和标签

### 浏览和搜索
- 多标签页分类浏览（全部/角色卡/世界书/我的上传）
- 全文搜索功能
- 标签过滤
- 多种排序方式（时间/下载量/名称）

### 下载和统计
- 一键下载功能（真实文件下载）
- 下载次数统计
- 上传时间记录
- 作者信息显示

## 组件结构

```
blackmarket/
├── BlackMarket.tsx         # 主组件
├── BlackMarket.css         # 主样式
├── UploadModal.tsx         # 上传弹窗
├── UploadModal.css         # 上传弹窗样式
├── CharacterCardViewer.tsx # 角色卡查看器
├── CharacterCardViewer.css # 角色卡查看器样式
├── WorldBookViewer.tsx     # 世界书查看器
├── WorldBookViewer.css     # 世界书查看器样式
├── blackMarketService.ts   # API服务（已开启真实后端）
├── types.ts               # 类型定义
├── index.ts               # 组件导出
└── README.md              # 说明文档
```

## 使用方法

### 在 DesktopPage 中集成

```tsx
import { BlackMarket } from './blackmarket';

// 添加状态
const [isBlackMarketOpen, setIsBlackMarketOpen] = useState(false);

// 渲染组件
<BlackMarket
  isOpen={isBlackMarketOpen}
  onClose={() => setIsBlackMarketOpen(false)}
/>
```

## 后端实现与存储

黑市后端已实现，使用 Next.js Route Handlers 和本地文件存储：
- 文件存储目录：`public/uploads/blackmarket/`
- 数据索引：`data/blackmarket/items.json`
- 存储管理：`src/lib/blackmarket/storage.ts`

注意：生产环境建议替换为对象存储（S3、OSS、COS 等）与数据库（PostgreSQL、MySQL、SQLite 等）。

### API 端点

- `GET /api/blackmarket/items` - 获取所有物品
- `GET /api/blackmarket/characters` - 获取角色卡
- `GET /api/blackmarket/worldbooks` - 获取世界书
- `GET /api/blackmarket/users/:username/uploads` - 获取用户上传
- `POST /api/blackmarket/upload/character` - 上传角色卡（PNG）
- `POST /api/blackmarket/upload/worldbook` - 上传世界书（JSON）
- `POST /api/blackmarket/download/:id` - 下载文件
- `POST /api/blackmarket/items/:id/download` - 更新下载次数
- `POST /api/blackmarket/parse/character` - 解析角色卡元数据（占位实现，返回空对象）

### 开发/部署说明

1. 本地开发：
   - 上传的文件会写入 `public/uploads/blackmarket/`
   - 元数据记录保存在 `data/blackmarket/items.json`
   - 默认作者为 `anonymous`，可对接登录系统将 `author` 设置为当前用户名称

2. 生产部署：
   - 将 `public/uploads/blackmarket/` 改为对象存储，返回可公开访问的 URL
   - 将 `data/blackmarket/items.json` 替换为数据库，并实现相应的数据读写层
   - 若使用远程图片域名，请在 `next.config.js` 的 `images` 配置中添加 `remotePatterns`

3. 安全与限制：
   - 建议限制文件大小（例如 10MB）并校验 MIME 类型
   - 为上传 API 添加鉴权（仅登录用户可上传）
   - 对下载次数更新接口做简单的频率限制（可选）

## 数据类型

### 角色卡
```typescript
interface CharacterCard {
  id: string;
  name: string;
  description: string;
  author: string;
  uploadDate: Date;
  downloadCount: number;
  fileUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  metadata?: {
    personality?: string;
    scenario?: string;
    firstMessage?: string;
  };
}
```

### 世界书
```typescript
interface WorldBook {
  id: string;
  name: string;
  description: string;
  author: string;
  uploadDate: Date;
  downloadCount: number;
  fileUrl: string;
  tags: string[];
  entryCount: number;
  metadata?: {
    theme?: string;
    entries?: Array<{
      key: string;
      content: string;
      priority?: number;
    }>;
  };
}
```

## 注意事项

1. **文件格式要求**
   - 角色卡必须为 PNG 格式
   - 世界书必须为 JSON 格式

2. **权限控制**
   - 需要登录才能上传文件（当前默认 `anonymous`，请按需接入鉴权）
   - 所有用户都可以浏览和下载

3. **文件大小限制**
   - 建议单个文件不超过 10MB
   - 服务端需要配置相应的上传限制

4. **兼容性**
   - 支持现代浏览器
   - 移动端自适应设计
   - 支持拖拽操作

## 开发说明

黑市功能使用：
- React Hooks 进行状态管理
- CSS Grid 和 Flexbox 进行布局
- File API + FormData 处理文件上传
- Next.js Route Handlers 作为后端服务
- 本地文件存储（可替换为云对象存储 + 数据库）
