# 黑市防抖动功能实现

## 功能概述

为了防止用户多次点击下载和导入按钮导致重复操作，我们为黑市模块的按钮添加了防抖动功能。

## 实现细节

### 1. 防抖动Hook

创建了两个防抖动Hook：

- `useDebounce`: 基础防抖动Hook，不返回状态
- `useDebounceState`: 带状态的防抖动Hook，返回处理状态

### 2. 防抖动参数

- **延迟时间**: 300ms
- **冷却时间**: 1000ms (操作完成后额外1秒冷却)
- **状态反馈**: 按钮显示"下载中..."、"导入中..."等状态

### 3. 应用范围

防抖动功能应用于以下按钮：

- 角色卡导入按钮
- 世界书导入按钮  
- 下载按钮
- ItemDetailModal中的相应按钮

### 4. 视觉反馈

- 按钮在禁用状态下变为灰色
- 按钮文字显示当前状态
- 鼠标悬停效果被禁用
- 透明度降低到0.6

### 5. 控制台日志

为了调试方便，添加了以下日志：

- "操作正在进行中，请稍候..." - 当尝试重复点击时
- "开始执行操作..." - 当操作开始时
- "操作完成，可以继续操作" - 当操作完成时

## 使用方法

用户现在可以：

1. 点击下载或导入按钮
2. 按钮会显示"下载中..."或"导入中..."状态
3. 在操作完成前，按钮会被禁用
4. 操作完成后，按钮恢复正常状态

## 技术实现

```typescript
// 防抖动状态hook
const useDebounceState = (callback: Function, delay: number) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (isProcessing) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsProcessing(true);
      callback(...args);
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }, delay);
  }, [callback, delay, isProcessing]);

  return { debouncedCallback, isProcessing };
};
```

## 样式实现

```css
.import-button:disabled,
.download-button:disabled {
  background: var(--text-tertiary, #9ca3af);
  color: var(--text-secondary, #6b7280);
  cursor: not-allowed;
  transform: none;
  opacity: 0.6;
}
```

## 测试建议

1. 快速连续点击下载按钮，验证只有第一次点击生效
2. 快速连续点击导入按钮，验证只有第一次点击生效
3. 检查按钮状态变化是否正确
4. 验证控制台日志输出
5. 测试不同网络条件下的行为
