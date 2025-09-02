'use client';

import { ExtraInfoPrompt } from './types';

// 导出工具函数
export const injectExtraInfoPrompt = (basePrompt: string, extraInfo: ExtraInfoPrompt): string => {
  if (!extraInfo.enabled || !extraInfo.description) {
    return basePrompt;
  }

  const extraInfoContent = `
# 额外信息功能

## 功能说明
用户已启用额外信息功能，你需要在回复中包含HTML格式的额外信息。

## 用户需求
${extraInfo.description}

## 输出要求
1. **正常回复**：按照常规方式回复用户的消息
2. **额外信息**：在回复的最后，必须包含一个额外的消息，类型为 'extra_info'
3. **HTML格式**：额外信息必须是有效的HTML代码，能够直接渲染
4. **直接显示**：HTML内容会直接显示在聊天中，不会被气泡包裹

## 剧情模式说明
如果在剧情模式中使用，请使用 {{html: ... }} 格式嵌入HTML，确保：
- HTML代码完整，不丢失任何标签或样式
- 代码在一行内，无换行干扰
- 语法完全正确，可直接复制使用

## 输出格式示例
[
  {"type": "text", "content": "你的正常回复内容"},
  {"type": "extra_info", "htmlContent": "<div style='background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:16px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);'><h3 style='margin:0 0 12px 0;font-size:18px;text-align:center;'>状态信息</h3><div style='display:flex;justify-content:space-between;align-items:center;'><span>心情: 愉快</span><span>位置: 家中</span><span>状态: 在线</span></div></div>", "description": "${extraInfo.description}"}
]

## 重要提醒
- 额外信息必须是完整的HTML代码
- HTML内容应该美观、实用，符合用户的需求描述
- 确保HTML代码的安全性，不要包含危险的脚本标签
- 额外信息会直接渲染在聊天界面中，提供丰富的视觉体验

## 格式保持要点
- **标签完整性**：确保所有HTML标签都完整闭合
- **样式完整性**：CSS样式属性必须完整，不能缺失
- **无换行干扰**：HTML代码内不要有换行符，保持在一行内
- **语法正确性**：确保HTML和CSS语法完全正确

## HTML设计建议
- 使用现代化的CSS样式
- 添加适当的颜色、字体、间距
- 考虑响应式设计
- 使用图标和视觉元素增强效果
- 确保在不同主题下都有良好的显示效果
`;

  return basePrompt + '\n\n' + extraInfoContent;
};

// 生成额外信息的提示词模板
export const generateExtraInfoPrompt = (description: string): string => {
  return `# 额外信息生成指南

## 用户需求
${description}

## 设计要求
1. **视觉美观**：使用现代化的设计风格
2. **功能实用**：满足用户的具体需求
3. **响应式**：在不同设备上都有良好显示
4. **主题适配**：支持明暗主题切换

## HTML结构建议
- 使用语义化的HTML标签
- 添加适当的CSS类名
- 使用CSS变量支持主题切换
- 添加合适的动画效果

## 样式建议
- 使用渐变背景
- 添加圆角和阴影
- 使用合适的字体和颜色
- 添加图标和装饰元素

请根据以上要求，生成一个美观实用的HTML代码。

## 格式保持检查
生成HTML后请确保：
1. ✅ 所有标签完整闭合
2. ✅ CSS样式属性完整
3. ✅ 代码在一行内，无换行
4. ✅ 语法正确，可直接使用

**重要**：HTML代码必须完整保持，不能丢失任何内容！`;
};
