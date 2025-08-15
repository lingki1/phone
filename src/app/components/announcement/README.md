# 公告系统使用说明

## 概述

这是一个支持多用户共享的公告系统，所有公告数据存储在服务器端，所有用户都能看到相同的公告内容。

## 功能特性

- ✅ 多用户共享公告
- ✅ 实时数据同步
- ✅ 公告类型分类（信息、警告、成功、错误）
- ✅ 优先级设置（高、中、低）
- ✅ 时间范围控制
- ✅ 公告状态管理（启用/禁用）
- ✅ 响应式设计

## 文件结构

```
announcement/
├── AnnouncementDisplay.tsx    # 公告显示组件
├── AnnouncementEditor.tsx     # 公告编辑组件
├── AnnouncementManager.tsx    # 公告管理器（主组件）
├── announcementService.ts     # API服务
├── types.ts                   # 类型定义
├── index.ts                   # 导出文件
├── README.md                  # 使用说明
└── *.css                      # 样式文件
```

## API 接口

### 获取所有公告
```
GET /api/announcements
```

### 创建新公告
```
POST /api/announcements
Content-Type: application/json

{
  "title": "公告标题",
  "content": "公告内容",
  "type": "info",
  "priority": "medium",
  "isActive": true,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

### 更新公告
```
PUT /api/announcements
Content-Type: application/json

{
  "id": "公告ID",
  "title": "新标题",
  "content": "新内容",
  ...
}
```

### 删除公告
```
DELETE /api/announcements?id=公告ID
```

## 使用方法

### 1. 基本使用

```tsx
import { AnnouncementManager } from '@/app/components/announcement';

function App() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <div>
      <AnnouncementManager
        isEditorOpen={isEditorOpen}
        onEditorClose={() => setIsEditorOpen(false)}
        onEditorOpen={() => setIsEditorOpen(true)}
      />
      
      <button onClick={() => setIsEditorOpen(true)}>
        管理公告
      </button>
    </div>
  );
}
```

### 2. 单独使用显示组件

```tsx
import { AnnouncementDisplay } from '@/app/components/announcement';

function MyComponent() {
  const [announcements, setAnnouncements] = useState([]);

  return (
    <AnnouncementDisplay
      announcements={announcements}
      onDismiss={(id) => {
        // 处理公告关闭
      }}
    />
  );
}
```

### 3. 使用API服务

```tsx
import { fetchAnnouncements, createAnnouncement } from '@/app/components/announcement';

// 获取公告
const announcements = await fetchAnnouncements();

// 创建公告
const newAnnouncement = await createAnnouncement({
  title: "新公告",
  content: "公告内容",
  type: "info",
  priority: "medium",
  isActive: true
});
```

## 数据存储

公告数据存储在 `data/announcements.json` 文件中，格式如下：

```json
[
  {
    "id": "announcement-1234567890-abc123",
    "title": "公告标题",
    "content": "公告内容",
    "type": "info",
    "priority": "medium",
    "isActive": true,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## 部署注意事项

1. 确保 `data` 目录有写入权限
2. 在生产环境中，建议使用数据库而不是文件存储
3. 可以添加认证机制来控制谁可以管理公告
4. 考虑添加缓存机制来提高性能

## 自定义样式

可以通过修改CSS文件来自定义公告系统的外观：

- `AnnouncementDisplay.css` - 公告显示样式
- `AnnouncementEditor.css` - 公告编辑器样式
- `AnnouncementManager.css` - 管理器样式

## 故障排除

### 常见问题

1. **公告不显示**
   - 检查公告是否已启用（isActive: true）
   - 检查时间范围是否正确
   - 检查API是否正常工作

2. **无法创建/编辑公告**
   - 检查网络连接
   - 检查服务器日志
   - 确保data目录有写入权限

3. **公告不同步**
   - 刷新页面
   - 检查是否有网络错误
   - 等待自动刷新（每5分钟）

### 调试

在浏览器控制台中可以看到详细的错误信息，API调用失败时会显示具体的错误信息。
