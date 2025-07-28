# Windows Phone风格桌面页面

## 功能概述

这是一个模仿Windows Phone Metro UI设计的手机桌面页面，具有以下特点：

### 🎨 设计风格
- **Metro UI**: 采用Windows Phone的方块设计语言
- **动态磁贴**: 彩色方块应用图标，支持不同尺寸
- **实时时间**: 大字体时间显示，符合Windows Phone设计
- **状态栏**: 显示信号、WiFi、电池等系统信息

### 📱 主要功能

#### 1. 实时时间显示
- **大字体时钟**: 4rem字体大小，清晰易读
- **日期显示**: 包含月份、日期和星期
- **自动更新**: 每秒更新时间显示
- **响应式**: 不同屏幕尺寸下自适应字体大小

#### 2. 应用方块网格
- **4x4网格布局**: 移动端4列，平板6列，桌面8列
- **三种尺寸**: 
  - Small: 1x1 方块
  - Medium: 1x1 方块（稍大）
  - Large: 2x1 矩形（预留）
- **彩色背景**: 每个应用有独特的品牌色彩
- **通知徽章**: 显示未读消息数量，支持99+显示

#### 3. 应用列表
目前包含8个应用：

| 应用 | 颜色 | 尺寸 | 通知 |
|------|------|------|------|
| QQ | #12B7F5 | Medium | 3 |
| 微信 | #07C160 | Medium | 1 |
| 电话 | #4CAF50 | Small | - |
| 短信 | #FF9800 | Small | 2 |
| 相机 | #9C27B0 | Small | - |
| 相册 | #E91E63 | Medium | - |
| 音乐 | #FF5722 | Small | - |
| 设置 | #607D8B | Small | - |

#### 4. 页面导航
- **桌面页面**: 应用启动页面，显示时间和应用方块
- **聊天页面**: 点击QQ应用进入聊天列表
- **返回功能**: 聊天页面左上角返回按钮，可回到桌面

### 🎯 交互体验

#### 1. 应用点击
```typescript
const handleAppClick = (app: AppTile) => {
  if (app.id === 'qq') {
    onOpenApp('qq'); // 打开QQ聊天
  } else {
    console.log(`打开应用: ${app.name}`);
  }
};
```

#### 2. 动画效果
- **加载动画**: 应用方块依次淡入上升
- **悬停效果**: 鼠标悬停时轻微放大和发光
- **点击反馈**: 按下时缩放效果
- **通知脉冲**: 通知徽章呼吸动画

#### 3. 响应式设计
```css
/* 移动端 */
@media (max-width: 480px) {
  .app-grid { grid-template-columns: repeat(3, 1fr); }
  .current-time { font-size: 3rem; }
}

/* 平板端 */
@media (min-width: 768px) {
  .app-grid { grid-template-columns: repeat(6, 1fr); }
  .current-time { font-size: 5rem; }
}

/* 桌面端 */
@media (min-width: 1024px) {
  .app-grid { grid-template-columns: repeat(8, 1fr); }
  .current-time { font-size: 6rem; }
}
```

### 🎨 视觉设计

#### 1. 颜色系统
- **背景渐变**: 蓝色渐变背景，符合Windows Phone主题
- **应用色彩**: 每个应用使用品牌色彩
- **深色模式**: 自动适配系统深色模式偏好

#### 2. 字体设计
- **Segoe UI**: Windows Phone标准字体
- **字重层次**: 300(时间) - 400(日期) - 500(应用名) - 600(激活状态)
- **文字阴影**: 增强可读性和层次感

#### 3. 阴影系统
```css
/* 应用方块阴影 */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

/* 激活状态阴影 */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);

/* 通知徽章阴影 */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
```

### 📁 文件结构

```
src/app/
├── components/
│   ├── DesktopPage.tsx      # 桌面页面组件
│   ├── DesktopPage.css      # 桌面页面样式
│   ├── ChatListPage.tsx     # 聊天列表页面
│   └── ChatListHeader.tsx   # 聊天页面头部
├── page.tsx                 # 主页面（页面切换逻辑）
└── globals.css              # 全局样式

public/app-icons/
├── default.svg              # 默认应用图标
├── qq.svg                   # QQ应用图标
├── wechat.svg              # 微信应用图标
├── phone.svg               # 电话应用图标
├── messages.svg            # 短信应用图标
├── camera.svg              # 相机应用图标
├── photos.svg              # 相册应用图标
├── music.svg               # 音乐应用图标
└── settings.svg            # 设置应用图标
```

### 🔧 技术实现

#### 1. 状态管理
```typescript
const [currentPage, setCurrentPage] = useState<'desktop' | 'chat'>('desktop');

const handleOpenApp = (appName: string) => {
  if (appName === 'qq') {
    setCurrentPage('chat');
  }
};

const handleBackToDesktop = () => {
  setCurrentPage('desktop');
};
```

#### 2. 时间更新
```typescript
useEffect(() => {
  const timer = setInterval(() => {
    const now = new Date();
    setCurrentTime(now);
    setCurrentDate(now);
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

#### 3. 应用数据
```typescript
interface AppTile {
  id: string;
  name: string;
  icon: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  notifications?: number;
}
```

### 🚀 使用方法

1. **启动应用**: 访问 `http://localhost:3000`
2. **查看桌面**: 默认显示Windows Phone风格桌面
3. **点击QQ**: 进入聊天列表页面
4. **返回桌面**: 点击左上角返回按钮

### 🎯 扩展功能

#### 1. 添加新应用
```typescript
const newApp: AppTile = {
  id: 'newapp',
  name: '新应用',
  icon: '/app-icons/newapp.svg',
  color: '#FF6B6B',
  size: 'medium',
  notifications: 0
};
```

#### 2. 自定义应用处理
```typescript
const handleAppClick = (app: AppTile) => {
  switch (app.id) {
    case 'qq':
      onOpenApp('qq');
      break;
    case 'wechat':
      onOpenApp('wechat');
      break;
    default:
      console.log(`打开应用: ${app.name}`);
  }
};
```

#### 3. 动态通知更新
```typescript
const updateNotifications = (appId: string, count: number) => {
  setAppTiles(prev => prev.map(app => 
    app.id === appId ? { ...app, notifications: count } : app
  ));
};
```

### 🎨 设计亮点

1. **Metro UI风格**: 完全符合Windows Phone设计语言
2. **实时时间**: 大字体显示，清晰易读
3. **彩色磁贴**: 每个应用有独特的品牌色彩
4. **通知系统**: 支持未读消息数量显示
5. **流畅动画**: 加载、悬停、点击都有动画反馈
6. **响应式设计**: 适配所有设备尺寸
7. **深色模式**: 自动适配系统主题偏好

### 🔮 未来规划

1. **更多应用**: 添加更多常用应用图标
2. **动态磁贴**: 支持实时信息显示（天气、新闻等）
3. **自定义布局**: 允许用户拖拽调整应用位置
4. **主题切换**: 支持多种颜色主题
5. **手势操作**: 添加滑动、长按等手势
6. **搜索功能**: 快速搜索应用
7. **文件夹**: 支持应用分组管理

---

**总结**: 这个Windows Phone风格的桌面页面完美复刻了Metro UI的设计精髓，提供了流畅的用户体验和丰富的交互效果，为手机应用提供了一个优雅的启动界面。 