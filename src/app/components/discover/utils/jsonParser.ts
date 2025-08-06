// 统一的强力JSON解析器 - 处理AI API响应的各种格式问题
export class JsonParser {
  
  // 🚀 超强健壮 JSON 解析函数
  static strongJsonExtract(raw: string): Record<string, unknown> {
    console.log('🔧 开始强力JSON解析，原始内容长度:', raw.length);
    console.log('📄 原始内容预览:', raw.substring(0, 200) + (raw.length > 200 ? '...' : ''));
    
    // 1. 清理和标准化输入
    let content = raw.trim();
    
    // 2. 移除可能的前后缀文本
    content = this.removeExtraText(content);
    
    // 3. 尝试提取代码块内容
    content = this.extractFromCodeBlock(content);
    
    // 4. 尝试直接解析
    try {
      const result = JSON.parse(content);
      console.log('✅ 直接解析成功');
      return result;
    } catch (error) {
      console.log('❌ 直接解析失败，开始修复...', error);
    }
    
    // 5. 尝试提取JSON对象/数组
    content = this.extractJsonStructure(content);
    
    // 6. 自动修复常见错误
    content = this.fixCommonJsonErrors(content);
    
    // 7. 尝试修复后的解析
    try {
      const result = JSON.parse(content);
      console.log('✅ 修复后解析成功');
      return result;
    } catch (error) {
      console.log('❌ 修复后解析失败，尝试逐步截断...', error);
    }
    
    // 8. 逐步截断到最后一个完整的JSON
    const truncatedResult = this.tryTruncatedParsing(content);
    if (truncatedResult) {
      return truncatedResult;
    }
    
    // 9. 尝试部分提取
    const partialResult = this.tryPartialExtraction(content);
    if (partialResult) {
      return partialResult;
    }
    
    // 10. 返回默认空结构
    console.log('⚠️ 所有解析方法失败，返回默认结构');
    console.log('📄 无法解析的内容:', content);
    return { posts: [], comments: [] };
  }
  
  // 移除可能的前后缀文本
  private static removeExtraText(content: string): string {
    // 移除常见的AI回复前缀
    const prefixes = [
      '好的，我来为您生成',
      '根据您的要求',
      '以下是生成的',
      '这是生成的',
      '生成结果如下',
      'Here is the',
      'Here are the',
      'Based on',
      'According to'
    ];
    
    for (const prefix of prefixes) {
      const index = content.toLowerCase().indexOf(prefix.toLowerCase());
      if (index !== -1) {
        content = content.substring(index + prefix.length);
        console.log('🧹 移除前缀文本');
        break;
      }
    }
    
    // 移除常见的后缀文本
    const suffixes = [
      '希望这些内容符合您的要求',
      '以上就是生成的内容',
      '这些内容应该符合要求',
      'I hope this helps',
      'Let me know if you need',
      'Feel free to ask'
    ];
    
    for (const suffix of suffixes) {
      const index = content.toLowerCase().lastIndexOf(suffix.toLowerCase());
      if (index !== -1) {
        content = content.substring(0, index);
        console.log('🧹 移除后缀文本');
        break;
      }
    }
    
    return content.trim();
  }
  
  // 从代码块中提取内容
  private static extractFromCodeBlock(content: string): string {
    // 尝试提取JSON代码块
    const jsonCodeMatch = content.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonCodeMatch) {
      console.log('📦 从JSON代码块中提取内容');
      return jsonCodeMatch[1].trim();
    }
    
    // 尝试提取普通代码块
    const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      console.log('📦 从代码块中提取内容');
      return codeBlockMatch[1].trim();
    }
    
    return content;
  }
  
  // 提取JSON结构
  private static extractJsonStructure(content: string): string {
    // 优先查找完整的对象或数组
    const fullJsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (fullJsonMatch) {
      console.log('🔍 提取JSON结构');
      return fullJsonMatch[0];
    }
    
    // 查找第一个 { 到最后一个 } 之间的内容
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      console.log('🔍 提取大括号范围内容');
      return content.substring(firstBrace, lastBrace + 1);
    }
    
    // 查找第一个 [ 到最后一个 ] 之间的内容
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      console.log('🔍 提取中括号范围内容');
      return content.substring(firstBracket, lastBracket + 1);
    }
    
    return content;
  }
  
  // 修复常见的JSON错误
  private static fixCommonJsonErrors(content: string): string {
    let fixedContent = content;
    
    // 修复结尾缺失的括号
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    
    // 补全缺失的闭合括号
    let bracesToAdd = openBraces - closeBraces;
    let bracketsToAdd = openBrackets - closeBrackets;
    
    while (bracesToAdd > 0) {
      fixedContent += '}';
      bracesToAdd--;
    }
    while (bracketsToAdd > 0) {
      fixedContent += ']';
      bracketsToAdd--;
    }
    
    // 删除多余的结尾逗号
    fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1');
    
    // 修复单引号为双引号
    fixedContent = fixedContent.replace(/'([^']*)':/g, '"$1":');
    fixedContent = fixedContent.replace(/:(\s*)'([^']*)'/g, ': "$2"');
    
    // 修复没有引号的键名
    fixedContent = fixedContent.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // 移除控制字符和非打印字符，但保留中文等Unicode字符
    fixedContent = fixedContent.replace(/[\x00-\x1F\x7F]/g, '');
    
    console.log('🔧 修复后内容长度:', fixedContent.length);
    
    return fixedContent;
  }
  
  // 尝试逐步截断解析
  private static tryTruncatedParsing(content: string): Record<string, unknown> | null {
    console.log('🔄 尝试逐步截断解析');
    
    // 从后往前逐步截断
    for (let i = content.length - 1; i > content.length * 0.5; i--) {
      try {
        const truncated = content.substring(0, i);
        
        // 确保截断点不在字符串中间
        if (truncated.endsWith('"') || truncated.endsWith('}') || truncated.endsWith(']')) {
          const result = JSON.parse(truncated);
          console.log(`✅ 截断到位置 ${i} 解析成功`);
          return result;
        }
      } catch {
        // 继续尝试
      }
    }
    
    return null;
  }
  
  // 尝试部分提取
  private static tryPartialExtraction(content: string): Record<string, unknown> | null {
    console.log('🔄 尝试部分提取');
    
    try {
      // 尝试提取posts数组
      const postsMatch = content.match(/"posts"\s*:\s*(\[[\s\S]*?\])/);
      // 尝试提取comments数组
      const commentsMatch = content.match(/"comments"\s*:\s*(\[[\s\S]*?\])/);
      
      if (postsMatch || commentsMatch) {
        const result: Record<string, unknown> = {};
        
        if (postsMatch) {
          try {
            result.posts = JSON.parse(postsMatch[1]);
            console.log('✅ 成功提取posts数组');
          } catch {
            result.posts = [];
          }
        }
        
        if (commentsMatch) {
          try {
            result.comments = JSON.parse(commentsMatch[1]);
            console.log('✅ 成功提取comments数组');
          } catch {
            result.comments = [];
          }
        }
        
        return result;
      }
      
      // 尝试提取post对象
      const postMatch = content.match(/"post"\s*:\s*(\{[\s\S]*?\})/);
      if (postMatch) {
        try {
          const post = JSON.parse(postMatch[1]);
          console.log('✅ 成功提取post对象');
          return { post, comments: [] };
        } catch {
          // 继续尝试其他方法
        }
      }
      
    } catch (error) {
      console.log('❌ 部分提取失败:', error);
    }
    
    return null;
  }
  
  // 验证和清理解析结果
  static validateAndClean(parsed: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    // 处理posts数组
    if (parsed.posts && Array.isArray(parsed.posts)) {
      result.posts = parsed.posts.filter((post: unknown) => {
        return post && typeof post === 'object' && 
               (post as Record<string, unknown>).content;
      });
    } else {
      result.posts = [];
    }
    
    // 处理comments数组
    if (parsed.comments && Array.isArray(parsed.comments)) {
      result.comments = parsed.comments.filter((comment: unknown) => {
        return comment && typeof comment === 'object' && 
               (comment as Record<string, unknown>).content &&
               (comment as Record<string, unknown>).characterId;
      });
    } else {
      result.comments = [];
    }
    
    // 处理单个post对象
    if (parsed.post && typeof parsed.post === 'object') {
      const post = parsed.post as Record<string, unknown>;
      if (post.content) {
        result.post = post;
      }
    }
    
    return result;
  }
} 