# 自定义主题功能

## 功能概述

自定义主题功能允许用户创建、编辑和管理自己的主题配色方案。用户可以自定义各种UI元素的颜色，包括背景色、文本色、强调色、气泡样式等。

## 主要特性

### 1. 主题创建
- 用户可以创建全新的自定义主题
- 支持自定义主题名称和描述
- 提供丰富的颜色配置选项

### 2. 颜色配置
- **背景色**: 主背景、次背景、第三背景
- **文本色**: 主文本、次文本、第三文本
- **强调色**: 主强调色、强调色悬停效果
- **气泡样式**: 用户气泡和AI气泡的背景色、文字色、圆角样式
- **特殊颜色**: 成功色、警告色、错误色、信息色

### 3. 主题管理
- 保存自定义主题到本地存储
- 编辑现有自定义主题
- 删除不需要的自定义主题
- 实时预览主题效果

### 4. 主题应用
- 一键应用自定义主题
- 支持主题预览功能
- 自动生成CSS变量
- 与现有主题系统完全兼容

## 技术实现

### 核心组件

1. **CustomThemeEditor**: 自定义主题编辑器组件
   - 提供直观的颜色选择界面
   - 支持实时预览
   - 包含完整的表单验证

2. **ThemeManager**: 主题管理器
   - 扩展支持自定义主题
   - 提供主题保存/加载功能
   - 生成自定义CSS变量

3. **ColorSettingsPage**: 配色设置页面
   - 集成自定义主题功能
   - 提供主题管理界面
   - 支持主题分类显示

### 数据结构

```typescript
interface CustomThemeColors {
  // 背景色
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  
  // 文本色
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // 强调色
  accentColor: string;
  accentHover: string;
  
  // 边框色
  borderColor: string;
  borderLight: string;
  
  // 阴影
  shadowLight: string;
  shadowMedium: string;
  shadowHeavy: string;
  
  // 气泡样式
  bubbleStyle: {
    userBubble: {
      bg: string;
      text: string;
      borderRadius: string;
    };
    aiBubble: {
      bg: string;
      text: string;
      borderRadius: string;
    };
  };
  
  // 特殊元素
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
}
```

### CSS变量生成

自定义主题通过动态生成CSS变量来实现：

```css
:root {
  --theme-bg-primary: #ffffff;
  --theme-bg-secondary: #f8f9fa;
  --theme-text-primary: #1f1f1f;
  --theme-accent-color: #007bff;
  /* ... 更多变量 */
}
```

## 使用方法

### 创建自定义主题

1. 进入"配色设置"页面
2. 选择"自定义主题"分类
3. 点击"新建自定义主题"按钮
4. 填写主题名称和描述
5. 配置各种颜色选项
6. 点击"预览"查看效果
7. 点击"保存"完成创建

### 编辑自定义主题

1. 在自定义主题分类中找到要编辑的主题
2. 点击主题卡片上的编辑按钮（✏️）
3. 修改颜色配置
4. 预览效果
5. 保存更改

### 删除自定义主题

1. 在自定义主题分类中找到要删除的主题
2. 点击主题卡片上的删除按钮（🗑️）
3. 确认删除操作

## 注意事项

1. **主题名称**: 建议使用有意义的名称，便于识别
2. **颜色搭配**: 注意颜色对比度，确保可读性
3. **预览功能**: 创建主题前建议先预览效果
4. **数据备份**: 自定义主题数据保存在本地，清除浏览器数据会丢失

## 未来扩展

- 主题导入/导出功能
- 主题分享功能
- 更多UI元素的自定义选项
- 主题模板库
- 自动颜色搭配建议
