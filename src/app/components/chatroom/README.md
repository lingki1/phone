# 公共聊天室模块

## 概述
这是一个简单的公共聊天室功能，允许所有访问网页的用户设置昵称后进行实时聊天。

## 功能特性
- 🎭 **昵称系统**: 用户可以设置和保存昵称
- ⏱️ **发言间隔**: 30秒发言冷却时间，防止刷屏
- 💾 **数据持久化**: 使用localStorage保存聊天记录和用户信息
- 📱 **响应式设计**: 适配移动端和桌面端
- 🎨 **独立样式**: 不依赖系统主题，避免样式冲突
- 🔄 **自动刷新**: 每5秒自动刷新消息
- 🧹 **数据清理**: 自动清理7天前的用户数据
- 💬 **回复功能**: 支持回复特定消息，显示回复关系

## 文件结构
```
chatroom/
├── types.ts                 # 类型定义
├── chatService.ts           # 数据服务层
├── PublicChatRoom.tsx       # 主聊天室组件
├── PublicChatRoom.css       # 独立样式文件
├── index.ts                 # 模块导出
└── README.md               # 说明文档
```

## 技术实现

### 数据存储
- 使用 **服务端API + JSON文件** 存储聊天消息和用户信息
- 所有用户共享同一份聊天记录，实现真正的公共聊天室
- 消息限制在1000条以内，自动删除旧消息
- 用户数据7天后自动清理

### 发言限制
- 每个用户30秒只能发送一条消息
- 实时显示剩余冷却时间
- 防止恶意刷屏

### 昵称验证
- 长度限制：2-20个字符
- 禁止特殊字符
- 自动保存到localStorage

## 使用方法

### 1. 导入组件
```tsx
import { PublicChatRoom } from '@/app/components/chatroom';
```

### 2. 使用组件
```tsx
const [isChatRoomOpen, setIsChatRoomOpen] = useState(false);

return (
  <>
    <button onClick={() => setIsChatRoomOpen(true)}>
      打开聊天室
    </button>
    
    <PublicChatRoom
      isOpen={isChatRoomOpen}
      onClose={() => setIsChatRoomOpen(false)}
    />
  </>
);
```

### 3. 回复功能使用
- 点击任意消息即可回复该消息
- 回复时会显示被回复消息的预览
- 发送的消息会显示回复标签和回复关系
- 可以点击"×"按钮取消回复

## 数据格式

### 聊天消息
```typescript
interface ChatMessage {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  createdAt: string;
  isMarked?: boolean; // 是否被标记为待办事项
  markedBy?: string; // 标记者的昵称
  markedAt?: number; // 标记时间
  // 可选：回复消息
  replyTo?: {
    messageId: string; // 被回复的消息ID
    timestamp: number;
    senderName: string;
    content: string;
  };
}
```

### 用户信息
```typescript
interface ChatUser {
  id: string;
  nickname: string;
  lastMessageTime: number;
}
```

## 性能优化
- 消息列表虚拟化（如需要可扩展）
- 定时清理过期数据
- 防抖输入处理
- 自动滚动优化

## 安全考虑
- 输入内容长度限制
- 昵称格式验证
- XSS防护（React默认）
- 发言频率限制

## 扩展建议
1. **后端集成**: 可替换localStorage为真实API
2. **实时推送**: 集成WebSocket实现真正的实时聊天
3. **表情支持**: 添加表情包功能
4. **消息类型**: 支持图片、文件等多媒体消息
5. **管理功能**: 添加管理员功能，支持消息删除等

## 注意事项
- 当前使用localStorage，刷新浏览器数据仍保留
- 不同浏览器/设备间数据不共享
- 建议生产环境替换为服务端存储方案
