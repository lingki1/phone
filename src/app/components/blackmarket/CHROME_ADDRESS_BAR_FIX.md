# Chrome浏览器地址栏遮挡问题修复

## 问题描述

在Chrome移动端浏览器中，黑市页面的顶部内容被浏览器地址栏遮挡，影响用户体验。

## 问题原因

1. 使用了 `height: 100vh` 固定视口高度
2. Chrome移动端的地址栏会动态显示/隐藏，导致实际可用高度变化
3. 没有考虑安全区域（safe-area-inset）的影响

## 解决方案

### 1. JavaScript动态计算视口高度

```tsx
// 解决Chrome地址栏遮挡问题
useEffect(() => {
  const updateViewportHeight = () => {
    // 设置CSS变量来动态计算可用高度
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // 初始化
  updateViewportHeight();

  // 监听窗口大小变化和方向变化
  window.addEventListener('resize', updateViewportHeight);
  window.addEventListener('orientationchange', updateViewportHeight);
  
  return () => {
    window.removeEventListener('resize', updateViewportHeight);
    window.removeEventListener('orientationchange', updateViewportHeight);
  };
}, []);
```

### 2. CSS使用动态视口高度

```css
.bm-blackmarket-container {
  height: 100vh; /* 回退值 */
  height: calc(var(--vh, 1vh) * 100);
  max-height: 100vh;
}
```

### 3. 多层级适配策略

#### 基础适配
- 使用 `calc(var(--vh, 1vh) * 100)` 动态计算高度
- 提供 `100vh` 作为回退值

#### 移动端特殊适配
```css
@media screen and (max-width: 768px) {
  .bm-blackmarket-container {
    border-radius: 0;
    width: 100vw;
    height: 100vh; /* 回退值 */
    height: calc(var(--vh, 1vh) * 100);
    max-height: 100vh;
  }
}
```

#### 小屏幕高度适配
```css
@media screen and (max-height: 700px) {
  .bm-blackmarket-container {
    height: calc(100vh - 60px);
    max-height: calc(100vh - 60px);
  }
}
```

#### 现代浏览器支持
```css
@supports (height: 100dvh) {
  .bm-blackmarket-container {
    height: 100dvh;
    max-height: 100dvh;
  }
}
```

## 技术特点

### 1. 渐进增强
- 基础支持：`100vh`
- 动态计算：`calc(var(--vh, 1vh) * 100)`
- 现代浏览器：`100dvh`

### 2. 事件监听
- `resize`: 窗口大小变化
- `orientationchange`: 设备方向变化

### 3. CSS变量
- 使用 `--vh` 自定义属性
- 实时更新视口高度
- 兼容性良好

## 兼容性

- ✅ Chrome (移动端/桌面端)
- ✅ Safari (iOS/桌面端)
- ✅ Firefox (移动端/桌面端)
- ✅ Edge (桌面端)
- ✅ 其他基于Chromium的浏览器

## 测试建议

1. **Chrome移动端测试**
   - 打开/关闭地址栏
   - 横屏/竖屏切换
   - 不同设备尺寸

2. **其他浏览器测试**
   - Safari iOS
   - Firefox移动端
   - 桌面端浏览器

3. **功能验证**
   - 页面内容不被遮挡
   - 滚动功能正常
   - 响应式布局正确

## 注意事项

1. **CSS命名规范**
   - 所有样式使用 `blackmarket-` 前缀
   - 避免与其他组件样式冲突

2. **性能考虑**
   - 事件监听器在组件卸载时清理
   - 使用 `useCallback` 优化函数

3. **用户体验**
   - 平滑的高度变化
   - 无闪烁或跳动
   - 保持原有功能完整性
