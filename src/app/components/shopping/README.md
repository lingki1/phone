# 购物功能主题适配说明

## 概述

购物功能现在已经完全适配了系统的主题系统，支持自动切换浅色和深色主题。

## 功能特性

### 1. 自动主题适配
- 所有组件都使用 CSS 变量来适配主题
- 支持浅色和深色主题自动切换
- 主题切换时所有样式实时更新

### 2. 主题切换按钮
- 在购物页面头部添加了主题切换按钮
- 点击按钮可以在浅色和深色主题之间切换
- 按钮图标会根据当前主题显示对应的图标

### 3. 适配的组件
- `ShoppingPage` - 主购物页面
- `ProductCard` - 商品卡片
- `ShoppingCart` - 购物车模态框

## CSS 变量使用

### 主要变量
- `--theme-bg-primary` - 主背景色
- `--theme-bg-secondary` - 次要背景色
- `--theme-bg-tertiary` - 第三级背景色
- `--theme-text-primary` - 主文本色
- `--theme-text-secondary` - 次要文本色
- `--theme-text-tertiary` - 第三级文本色
- `--theme-accent-color` - 强调色
- `--theme-accent-hover` - 强调色悬停状态
- `--theme-border-color` - 边框色
- `--theme-border-light` - 浅色边框
- `--theme-shadow-light` - 浅色阴影
- `--theme-shadow-medium` - 中等阴影
- `--theme-shadow-heavy` - 重阴影

### 深色主题适配
所有组件都包含了 `[data-theme="dark"]` 选择器来适配深色主题。

## 使用方法

### 1. 基本使用
```tsx
import ShoppingPage from './components/shopping/ShoppingPage';

// 在组件中使用
<ShoppingPage 
  apiConfig={apiConfig} 
  onBack={handleBack} 
/>
```

### 2. 主题切换
主题切换功能已经集成在购物页面中，用户可以通过点击主题切换按钮来切换主题。

### 3. 调试模式
在开发模式下，页面右上角会显示当前主题状态，方便调试。

## 样式文件

- `ShoppingPage.css` - 主页面样式
- `ProductCard.css` - 商品卡片样式
- `ShoppingCart.css` - 购物车样式

## 注意事项

1. 确保主题系统正常工作
2. CSS 变量需要在使用前定义
3. 深色主题适配需要测试各种场景
4. 主题切换时注意性能优化

## 未来改进

1. 添加更多主题选项
2. 支持自定义主题色
3. 添加主题切换动画
4. 优化移动端主题适配

