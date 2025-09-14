export type ParsedAiInstruction = {
  type?: string;
  [key: string]: unknown;
};

/**
 * 安全地清洗 HTML 内容，移除危险标签和属性
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  try {
    return html
      // 移除 script 标签及其内容
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // 移除 iframe 标签
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // 移除 object 标签
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      // 移除 embed 标签
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      // 移除所有 on* 事件属性
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      // 移除 javascript: 协议
      .replace(/javascript:/gi, '')
      // 移除 data: 协议（可选，根据需要调整）
      .replace(/data:\s*[^;]*;base64,/gi, 'data:;base64,');
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    return '';
  }
}

/**
 * 解析 AI 返回内容为指令对象数组。
 * 普通聊天模式：返回指令数组供上层逐条转换为 Message。
 * 剧情模式：直接将整段文本作为一条 text 指令返回。
 */
export function parseAiResponse(content: string, isStoryMode: boolean = false): ParsedAiInstruction[] {
  if (isStoryMode) {
    return [{ type: 'text', content }];
  }

  const trimmedContent = (content ?? '').toString().trim();

  // 方案1：整体是标准 JSON 数组
  if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmedContent);
      if (Array.isArray(parsed)) {
        return parsed as ParsedAiInstruction[];
      }
    } catch {
      // fallthrough to 强力解析
    }
  }

  // 方案2：强力解析，提取独立 JSON 对象
  const jsonMatches = trimmedContent.match(/{[^{}]*}/g);
  if (jsonMatches) {
    const results: ParsedAiInstruction[] = [];
    for (const match of jsonMatches) {
      try {
        const obj = JSON.parse(match);
        results.push(obj);
      } catch {
        // ignore invalid json fragment
      }
    }
    if (results.length > 0) return results;
  }

  // 方案3：兜底文本
  return [{ type: 'text', content }];
}


