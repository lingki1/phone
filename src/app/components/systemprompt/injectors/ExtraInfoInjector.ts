import { PromptInjector, PromptContext } from '../types';

export class ExtraInfoInjector implements PromptInjector {
  priority = 25; // 额外信息注入优先级低于状态注入

  async inject(context: PromptContext): Promise<string> {
    const { extraInfoConfig, isStoryMode } = context;
    
    // 如果没有额外信息配置或未启用，则不注入
    if (!extraInfoConfig || !extraInfoConfig.enabled || !extraInfoConfig.description) {
      return '';
    }

    // 注入额外信息提示词
    const extraInfoContent = this.buildExtraInfoContent(extraInfoConfig, isStoryMode);
    
    return extraInfoContent;
  }

  // 构建额外信息内容
  private buildExtraInfoContent(extraInfoConfig: {
    enabled: boolean;
    description: string;
    lastUpdate: number;
  }, isStoryMode?: boolean): string {
    return `

# 额外信息功能

## 功能说明
用户已启用额外信息功能，你需要在回复中包含HTML格式的额外信息。

## 用户需求
${extraInfoConfig.description}

## 输出要求
${isStoryMode ? `
**剧情模式特殊要求**：
由于剧情模式是长文本格式，你需要在故事叙述中自然地嵌入HTML模块，而不是单独的消息。

**格式要求**：
1. **故事内容**：按照剧情模式编写完整的故事内容
2. **HTML嵌入**：在故事中适当位置使用 {{html: ... }} 标记嵌入HTML内容
3. **自然融入**：HTML内容应该与故事情节自然结合，不要突兀
4. **格式保持**：HTML内容必须完整保留，不能丢失任何标签或样式

**HTML嵌入语法**：
使用 {{html: 你的HTML代码}} 格式，注意：
- 冒号后面直接跟HTML代码，不要有换行
- HTML代码必须完整，包含所有必要的标签和样式
- 不要在HTML代码中添加额外的空格或换行符

**示例格式**：
这是一个关于冒险的故事。主角来到了一个神秘的地方...

{{html:<span style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:6px 10px;border-radius:6px;margin:0 4px;font-weight:bold;font-size:13px;">🗺️ 神秘地图</span><span style="background:#e3f2fd;color:#1976d2;padding:4px 8px;border-radius:4px;margin:0 2px;font-size:12px;">位置: 神秘森林</span><span style="background:#fff3e0;color:#f57c00;padding:4px 8px;border-radius:4px;margin:0 2px;font-size:12px;">难度: ⭐⭐⭐</span><span style="background:#f3e5f5;color:#7b1fa2;padding:4px 8px;border-radius:4px;margin:0 2px;font-size:12px;">宝藏: 未知</span>}}

主角看着这些神秘的信息，心中充满了期待...

**重要提醒**：
- HTML代码必须完整，不能缺少任何标签
- 样式属性必须完整，包括所有必要的CSS属性
- 不要在{{html:}}标记内添加换行或多余空格
- 确保HTML代码的语法正确性
` : `
**普通聊天模式要求**：
1. **正常回复**：按照常规方式回复用户的消息
2. **额外信息**：在回复的最后，必须包含一个额外的消息，类型为 'extra_info'
3. **HTML格式**：额外信息必须是有效的HTML代码，能够直接渲染
4. **直接显示**：HTML内容会直接显示在聊天中，不会被气泡包裹

**输出格式示例**：
[
  {"type": "text", "content": "你的正常回复内容"},
  {"type": "extra_info", "htmlContent": "<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);'><h3 style='margin: 0 0 12px 0; font-size: 18px; text-align: center;'>状态信息</h3><div style='display: flex; justify-content: space-between; align-items: center;'><span>心情: 愉快</span><span>位置: 家中</span><span>状态: 在线</span></div></div>", "description": "${extraInfoConfig.description}"}
]
`}

## 重要提醒
- 额外信息必须是完整的HTML代码
- HTML内容应该美观、实用，符合用户的需求描述
- 确保HTML代码的安全性，不要包含危险的脚本标签
- 额外信息会直接渲染在聊天界面中，提供丰富的视觉体验

## 剧情模式HTML格式保持要点
- **标签完整性**：确保所有HTML标签都完整闭合
- **样式完整性**：CSS样式属性必须完整，不能缺失
- **无换行干扰**：HTML代码内不要有换行符，保持在一行内
- **语法正确性**：确保HTML和CSS语法完全正确
- **测试验证**：生成的HTML应该能够直接复制粘贴到浏览器中正常显示

## HTML设计建议
- 使用现代化的CSS样式
- 添加适当的颜色、字体、间距
- 考虑响应式设计
- 使用图标和视觉元素增强效果
- 确保在不同主题下都有良好的显示效果

## 示例HTML模板
根据用户需求"${extraInfoConfig.description}"，你可以参考以下模板：

### 剧情模式HTML模板（格式稳定）
\`\`\`html
<!-- 状态标签样式 -->
<span style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:6px 10px;border-radius:6px;margin:0 4px;font-weight:bold;font-size:13px;">状态标签</span>

<!-- 信息卡片样式 -->
<div style="background:white;border:1px solid #e1e5e9;border-radius:8px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:280px;margin:8px auto;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><div style="width:32px;height:32px;background:#007bff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;">📊</div><div><h4 style="margin:0;color:#333;font-size:14px;">标题</h4><p style="margin:2px 0 0 0;color:#666;font-size:12px;">描述</p></div></div><div style="background:#f8f9fa;padding:8px;border-radius:4px;color:#495057;font-size:12px;">具体内容</div></div>

<!-- 进度条样式 -->
<div style="background:#f0f0f0;border-radius:10px;padding:2px;margin:4px 0;"><div style="background:linear-gradient(90deg,#4caf50,#45a049);height:8px;border-radius:8px;width:75%;transition:width 0.3s ease;"></div></div>
\`\`\`

### 普通聊天模式HTML模板
\`\`\`html
<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:16px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);"><h3 style="margin:0 0 12px 0;font-size:18px;text-align:center;">状态信息</h3><div style="display:flex;justify-content:space-between;align-items:center;"><span>心情: 愉快</span><span>位置: 家中</span><span>状态: 在线</span></div></div>
\`\`\`

请根据用户的具体需求，生成相应的HTML代码。

## 格式保持检查清单
在生成HTML代码后，请检查：
1. ✅ 所有HTML标签是否完整闭合
2. ✅ CSS样式属性是否完整（包括分号）
3. ✅ 是否有多余的空格或换行符
4. ✅ HTML代码是否在一行内完整
5. ✅ 语法是否正确（可以复制到浏览器测试）

**记住**：剧情模式中，HTML代码必须完全保持格式，不能有任何丢失！`;
  }
}
