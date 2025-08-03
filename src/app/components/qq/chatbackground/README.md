# 聊天背景自定义功能

## 功能概述

聊天背景自定义功能允许用户为每个聊天设置个性化的背景图片，并添加动态动画效果，支持上传本地图片并转换为base64格式存储。

## 组件结构

```
chatbackground/
├── ChatBackgroundModal.tsx        # 背景设置模态框
├── ChatBackgroundModal.css        # 模态框样式
├── ChatBackgroundManager.tsx      # 背景管理器
├── AnimationSelector.tsx          # 动画效果选择器
├── AnimationSelector.css          # 动画选择器样式
├── ChatBackgroundAnimations.css   # 动画效果CSS
├── index.ts                       # 组件导出
└── README.md                      # 说明文档
```

## 主要功能

### 1. 图片上传
- 支持 JPG、PNG、GIF 格式
- 文件大小限制：5MB
- 自动转换为 base64 格式
- 预览时保持原图比例，不压缩长宽

### 2. 主题集成
- 完全使用现有主题系统的CSS变量
- 自动适配深色/浅色主题
- 支持所有预设主题配色方案

### 3. 数据存储
- 使用 IndexedDB 进行持久化存储
- localStorage 作为备份存储
- 支持数据库和本地存储的双重保障

### 4. 背景显示
- 半透明效果（opacity: 0.3）
- 自适应覆盖整个聊天界面
- 不影响用户交互

### 5. 动画效果（新增）
- **微妙效果**：缓慢移动、呼吸效果（推荐移动端）
- **动态效果**：脉冲、波浪、3D倾斜、组合效果
- **艺术效果**：色彩渐变、聚焦、粒子、动态边框
- 支持动画开关和性能优化

## 使用方法

### 在聊天界面中

1. 点击聊天页面右上角的 🖼️ 图标
2. 在弹出的模态框中上传背景图片
3. 选择动画效果（可选）
4. 点击"保存"按钮应用背景和动画
5. 点击"清除背景"可以移除当前背景和动画

### 技术实现

#### 数据库存储
```typescript
// 保存背景
await dataManager.saveChatBackground(chatId, background);

// 获取背景
const background = await dataManager.getChatBackground(chatId);

// 保存动画设置（localStorage）
localStorage.setItem(`chatAnimation_${chatId}`, animation);

// 获取动画设置
const animation = localStorage.getItem(`chatAnimation_${chatId}`) || 'none';
```

#### 组件集成
```typescript
import { ChatBackgroundManager, ChatBackgroundModal, AnimationSelector } from './chatbackground';

// 在聊天界面中使用
<ChatBackgroundManager
  chatId={chat.id}
  onBackgroundChange={(background, animation) => {
    setChatBackground(background);
    setChatAnimation(animation);
  }}
>
  {/* 聊天界面内容 */}
</ChatBackgroundManager>
```

## 样式特性

- 响应式设计，支持移动端和桌面端
- 现代化UI设计，包含动画效果
- 完全集成现有主题系统，自动适配所有主题
- 使用CSS变量，支持实时主题切换
- 图片预览保持原比例，自适应容器大小
- 无障碍访问支持
- **动画效果性能优化**：移动端自动减少动画时间，支持系统动画偏好设置

## 注意事项

1. 图片文件大小限制为5MB，超过限制会显示错误提示
2. 背景图片以base64格式存储，大图片可能影响性能
3. 建议使用压缩后的图片以获得更好的性能
4. 背景透明度设置为0.3，确保文字可读性
5. **动画效果会增加设备电量消耗，建议移动端使用"微妙"类别的效果**
6. **支持系统`prefers-reduced-motion`设置，自动禁用动画**

## 未来扩展

- 支持背景图片裁剪和编辑
- 支持背景图片的模糊度和亮度调节
- 支持按聊天类型设置不同的默认背景
- 支持背景图片的主题滤镜效果 