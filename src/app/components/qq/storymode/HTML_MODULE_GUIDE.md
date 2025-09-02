# 剧情模式HTML模块使用指南

## 功能概述

剧情模式现在支持在长文本故事中嵌入HTML模块，让AI可以在故事叙述中自然地展示美观的视觉元素，如状态栏、信息卡片、进度条等。HTML内容会直接与文字在同一层显示，没有额外的包裹背景。

## 使用方法

### 1. 启用额外信息功能

1. 在聊天界面中，点击右上角的"⭐"按钮
2. 在弹出的设置窗口中，勾选"启用额外信息功能"
3. 在"功能描述"文本框中输入你的需求，例如：
   ```
   我希望在故事中显示角色的状态信息，包括心情、位置、装备等
   ```

### 2. AI回复格式

启用后，AI会在剧情模式中使用以下格式：

```
这是一个关于冒险的故事。主角来到了一个神秘的地方...

{{html: <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 12px; border-radius: 8px; margin: 0 4px; font-size: 14px; font-weight: bold;">❤️ 85/100</span> <span style="background: linear-gradient(135deg, #20c997, #28a745); color: white; padding: 8px 12px; border-radius: 8px; margin: 0 4px; font-size: 14px; font-weight: bold;">⚡ 60/80</span> <span style="background: linear-gradient(135deg, #ffc107, #fd7e14); color: white; padding:8px 12px; border-radius: 8px; margin: 0 4px; font-size: 14px; font-weight: bold;">🛡️ 45</span>}}

主角看着自己的状态面板，心中充满了期待...
```

### 3. HTML模块语法

使用 `{{html: ... }}` 标记来嵌入HTML内容：

- **开始标记**: `{{html:`
- **HTML内容**: 完整的HTML代码
- **结束标记**: `}}`

## 应用场景示例

### 1. 角色状态显示

```
{{html: <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 12px; border-radius: 8px; margin: 0 4px; font-size: 14px; font-weight: bold;">❤️ 85/100</span> <span style="background: linear-gradient(135deg, #20c997, #28a745); color: white; padding: 8px 12px; border-radius: 8px; margin: 0 4px; font-size: 14px; font-weight: bold;">⚡ 60/80</span> <span style="background: linear-gradient(135deg, #ffc107, #fd7e14); color: white; padding:8px 12px; border-radius: 8px; margin: 0 4px; font-size: 14px; font-weight: bold;">🛡️ 45</span>}}
```

### 2. 物品信息卡片

```
{{html: <span style="background: linear-gradient(135deg, #ffd700, #ffed4e); color: #333; padding: 6px 10px; border-radius: 6px; margin: 0 4px; font-weight: bold; font-size: 13px;">⚔️ 魔法剑</span> <span style="background: #f8f9fa; color: #495057; padding: 4px 8px; border-radius: 4px; margin: 0 2px; font-size: 12px;">攻击力: 150</span> <span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; margin: 0 2px; font-size: 12px;">魔法+30</span> <span style="background: #fff3e0; color: #f57c00; padding: 4px 8px; border-radius: 4px; margin: 0 2px; font-size: 12px;">🔥 火焰伤害</span>}}
```

### 3. 进度指示器

```
{{html: <span style="background: #e9ecef; border-radius: 10px; height: 18px; display: inline-block; width: 120px; overflow: hidden; margin: 0 4px; vertical-align: middle;"><div style="background: linear-gradient(90deg, #28a745, #20c997); height: 100%; width: 65%; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">65%</div></span> <span style="color: #666; font-size: 12px; margin-left: 4px;">已完成3/5个任务</span>}}
```

### 4. 环境信息面板

```
{{html: <span style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 6px 10px; border-radius: 6px; margin: 0 4px; font-weight: bold; font-size: 13px;">🌲 神秘森林</span> <span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; margin: 0 2px; font-size: 12px;">🌡️ 18°C</span> <span style="background: #f3e5f5; color: #7b1fa2; padding: 4px 8px; border-radius: 4px; margin: 0 2px; font-size: 12px;">💨 轻微</span> <span style="background: #e8f5e8; color: #388e3c; padding: 4px 8px; border-radius: 4px; margin: 0 2px; font-size: 12px;">☁️ 多云</span> <span style="background: #fff3e0; color: #f57c00; padding: 4px 8px; border-radius: 4px; margin: 0 2px; font-size: 12px;">🌙 傍晚</span>}}
```

## 设计建议

### 1. 视觉风格

- **配色方案**: 使用渐变背景和协调的颜色
- **圆角设计**: 现代化的圆角边框
- **阴影效果**: 适当的阴影增加层次感
- **图标使用**: 使用emoji或Unicode符号增强视觉效果
- **内联显示**: HTML内容直接与文字同层，无需额外包裹

### 2. 内容布局

- **信息层次**: 使用标题、副标题、正文的层次结构
- **网格布局**: 使用flexbox或grid进行灵活布局
- **响应式**: 确保在不同屏幕尺寸下都有良好显示
- **间距控制**: 合理的内边距和外边距

### 3. 主题适配

- **明暗主题**: 使用CSS变量支持主题切换
- **颜色对比**: 确保文字在背景上有足够的对比度
- **可读性**: 字体大小和行高要适合阅读

## 安全注意事项

### 1. HTML过滤

系统会自动过滤以下危险内容：
- `<script>` 标签
- `<iframe>` 标签
- `<object>` 标签
- `<embed>` 标签
- `onclick` 等事件属性
- `javascript:` 协议

### 2. 内容限制

- 避免使用复杂的JavaScript代码
- 不要包含外部链接或资源
- 建议使用内联样式而非外部CSS

## 故障排除

### 1. HTML不显示

- 检查HTML语法是否正确
- 确认使用了正确的 `{{html: ... }}` 标记
- 查看浏览器控制台是否有错误信息

### 2. 样式异常

- 检查CSS属性是否被浏览器支持
- 避免使用实验性的CSS属性
- 测试在不同浏览器中的显示效果

### 3. 性能问题

- 避免过于复杂的HTML结构
- 减少DOM节点的数量
- 使用简单的CSS动画而非复杂的JavaScript动画

## 最佳实践

1. **自然融入**: HTML模块应该与故事情节自然结合
2. **适度使用**: 不要过度使用，影响故事的流畅性
3. **一致性**: 保持HTML模块的视觉风格一致
4. **可读性**: 确保HTML内容易于阅读和理解
5. **响应式**: 考虑在不同设备上的显示效果
6. **内联设计**: HTML内容应该设计为内联显示，与文字自然融合

## 扩展功能

未来可能支持的功能：
- 动画效果
- 交互元素
- 数据可视化
- 主题模板
- 自定义组件库
