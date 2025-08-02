# 底部导航切换修复

## 问题描述

用户从"我"页面离开后，第二次点击"我"按钮没有反应，页面无法正常切换。

## 问题分析

通过代码分析发现以下问题：

1. **重复点击检查缺失**：`handleViewChange` 函数没有检查是否点击了同一个视图
2. **状态管理问题**：`PageTransitionManager` 中的 `isTransitioning` 状态可能导致重复点击被阻止
3. **动画时机问题**：`PageTransition` 组件的动画状态管理不够稳定

## 修复方案

### 1. 修复 ChatListPage.tsx 中的 handleViewChange 函数

```typescript
const handleViewChange = (view: string) => {
  // 防止重复点击同一个视图
  if (activeView === view) return;
  
  setActiveView(view);
  if (view === 'me') {
    setCurrentScreen('me');
  } else if (view === 'messages') {
    setCurrentScreen('list');
  }
};
```

**修复内容：**
- 添加重复点击检查，避免不必要的状态更新
- 明确处理 'messages' 视图的切换逻辑

### 2. 优化 PageTransitionManager.tsx 的状态管理

```typescript
useEffect(() => {
  if (currentPageId !== currentPage) {
    setIsTransitioning(true);
    setCurrentPage(currentPageId);
  }
}, [currentPageId, currentPage]);
```

**修复内容：**
- 移除 `isTransitioning` 检查，避免状态卡住
- 简化状态更新逻辑

### 3. 改进 PageTransition.tsx 的动画时机

```typescript
useEffect(() => {
  if (isVisible) {
    setShouldRender(true);
    // 使用 requestAnimationFrame 确保 DOM 更新后再开始动画
    requestAnimationFrame(() => {
      setIsAnimating(true);
    });
  } else {
    setIsAnimating(false);
    const timer = setTimeout(() => {
      setShouldRender(false);
    }, duration);
    return () => clearTimeout(timer);
  }
}, [isVisible, duration]);
```

**修复内容：**
- 使用 `requestAnimationFrame` 确保 DOM 更新后再开始动画
- 提高动画状态的可靠性

## 测试验证

使用 `test-bottom-nav-fix.ps1` 脚本进行测试：

1. 点击QQ应用图标进入聊天界面
2. 点击底部导航的"我"按钮
3. 在"我"页面中点击任意设置项
4. 返回主界面
5. 再次点击"我"按钮 - 应该能正常切换
6. 重复测试多次，确保没有卡住

## 预期效果

- 底部导航切换更加稳定可靠
- 重复点击不会导致状态异常
- 页面切换动画更加流畅
- 用户体验得到改善

## 相关文件

- `src/app/components/qq/ChatListPage.tsx`
- `src/app/components/utils/PageTransitionManager.tsx`
- `src/app/components/utils/PageTransition.tsx`
- `test-bottom-nav-fix.ps1` 