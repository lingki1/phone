# 黑市标签过滤器优化

## 功能概述

为了解决标签过多导致页面性能问题，我们实现了响应式的标签折叠功能。

## 主要改进

### 1. 响应式标签数量限制
- **大屏幕 (>768px)**: 默认显示8个标签
- **中等屏幕 (481px-768px)**: 默认显示5个标签  
- **小屏幕 (≤480px)**: 默认显示3个标签
- 超过限制时显示"展开 (+N)"按钮
- 展开后显示所有标签，按钮变为"收起"

### 2. 性能优化
- 根据屏幕尺寸动态调整显示的标签数量
- 减少初始渲染的DOM元素数量
- 避免大量标签导致的布局重排
- 提升页面响应速度

### 3. 用户体验
- 平滑的展开/收起动画
- 清晰的视觉反馈
- 响应式设计，适配移动端
- 实时响应窗口大小变化

## 技术实现

### React组件修改
```tsx
const [tagsExpanded, setTagsExpanded] = useState(false);
const [maxVisibleTags, setMaxVisibleTags] = useState(8);

// 响应式标签数量设置
useEffect(() => {
  const updateMaxVisibleTags = () => {
    const width = window.innerWidth;
    if (width <= 480) {
      setMaxVisibleTags(3); // 小屏幕显示3个
    } else if (width <= 768) {
      setMaxVisibleTags(5); // 中等屏幕显示5个
    } else {
      setMaxVisibleTags(8); // 大屏幕显示8个
    }
  };

  updateMaxVisibleTags();
  window.addEventListener('resize', updateMaxVisibleTags);
  
  return () => {
    window.removeEventListener('resize', updateMaxVisibleTags);
  };
}, []);

// 标签渲染逻辑
{getAllTags().slice(0, tagsExpanded ? undefined : maxVisibleTags).map(tag => (
  <button key={tag} className={`blackmarket-tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}>
    {tag}
  </button>
))}

// 展开/收起按钮
{getAllTags().length > maxVisibleTags && (
  <button className="blackmarket-tags-toggle" onClick={() => setTagsExpanded(!tagsExpanded)}>
    {tagsExpanded ? '收起' : `展开 (+${getAllTags().length - maxVisibleTags})`}
  </button>
)}
```

### CSS样式特点
- 使用 `blackmarket-` 前缀防止样式冲突
- 响应式设计，适配不同屏幕尺寸
- 平滑的过渡动画效果
- 悬停时的视觉反馈

## 样式类名

- `.blackmarket-tags-filter` - 标签过滤器容器
- `.blackmarket-tag-filter` - 单个标签按钮
- `.blackmarket-tags-toggle` - 展开/收起按钮
- `.blackmarket-tags-sort-row` - 标签和排序行容器

## 响应式断点

- **>768px**: 显示8个标签，标准间距
- **481px-768px**: 显示5个标签，紧凑间距
- **≤480px**: 显示3个标签，最小间距

## 移动端优化

### 小屏幕 (≤480px)
- 标签间距: 4px
- 标签内边距: 4px 8px
- 字体大小: 10px
- 圆角: 16px

### 中等屏幕 (481px-768px)
- 标签间距: 6px
- 标签内边距: 6px 12px
- 字体大小: 12px
- 圆角: 20px

## 使用说明

1. 页面加载时根据屏幕尺寸显示相应数量的标签
2. 如果标签总数超过限制，会显示"展开 (+N)"按钮
3. 点击"展开"按钮显示所有标签
4. 点击"收起"按钮回到默认状态
5. 窗口大小变化时自动调整显示的标签数量
6. 标签选择功能保持不变

## 开发调试

在开发模式下，会显示当前显示的标签数量和总标签数量：
```
显示: 5/12
```

这有助于调试和验证响应式功能是否正常工作。
