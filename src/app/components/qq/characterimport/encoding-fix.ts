/**
 * 编码修复工具
 * 用于修复 SillyTavern 角色卡片中的中文编码问题
 */

export class EncodingFixer {
  /**
   * 修复 Base64 解码后的字符串编码问题
   */
  static fixEncoding(decodedString: string): string {
    console.log('开始修复编码问题...');
    console.log('原始字符串长度:', decodedString.length);
    console.log('原始字符串预览:', decodedString.substring(0, 100));
    
    // 方法1: 检查是否包含乱码字符
    if (this.containsGarbledText(decodedString)) {
      console.log('检测到乱码，尝试修复...');
      return this.fixGarbledText(decodedString);
    }
    
    // 方法2: 检查是否包含 Unicode 转义序列
    if (decodedString.includes('\\u')) {
      console.log('检测到 Unicode 转义序列，尝试修复...');
      return this.fixUnicodeEscapes(decodedString);
    }
    
    // 方法3: 尝试 TextDecoder 修复
    try {
      const bytes = new Uint8Array(decodedString.length);
      for (let i = 0; i < decodedString.length; i++) {
        bytes[i] = decodedString.charCodeAt(i);
      }
      
      const decoder = new TextDecoder('utf-8');
      const fixedString = decoder.decode(bytes);
      console.log('使用 TextDecoder 修复成功');
      return fixedString;
    } catch (error) {
      console.log('TextDecoder 修复失败:', error);
    }
    
    // 如果所有方法都失败，返回原始字符串
    console.log('编码修复失败，返回原始字符串');
    return decodedString;
  }
  
  /**
   * 检查字符串是否包含乱码
   */
  private static containsGarbledText(str: string): boolean {
    // 检查是否包含常见的乱码模式
    const garbledPatterns = [
      /ä¿\x9E/, // 常见的乱码模式
      /ä¹\x90/,
      /è§\x92/,
      /è\x89²/,
      /å\x90\x8D/,
      /\x9E/g,
      /\x90/g,
      /\x92/g,
      /\x89/g
    ];
    
    return garbledPatterns.some(pattern => pattern.test(str));
  }
  
  /**
   * 修复乱码文本
   */
  private static fixGarbledText(str: string): string {
    console.log('尝试修复乱码文本...');
    
    // 将字符串转换为字节数组
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    
    console.log('字节数组长度:', bytes.length);
    console.log('字节数组预览:', Array.from(bytes.slice(0, 20)));
    
    // 尝试不同的编码方式
    const encodings = ['utf-8', 'utf8', 'latin1', 'iso-8859-1'];
    
    for (const encoding of encodings) {
      try {
        const decoder = new TextDecoder(encoding);
        const fixedString = decoder.decode(bytes);
        
        // 检查修复后的字符串是否还包含乱码
        if (!this.containsGarbledText(fixedString)) {
          console.log(`使用 ${encoding} 编码修复成功`);
          return fixedString;
        }
      } catch (error) {
        console.log(`${encoding} 编码修复失败:`, error);
      }
    }
    
    console.log('所有编码方式都失败，尝试手动修复...');
    
    // 手动修复常见的乱码模式
    let fixedString = str;
    
    // 修复常见的乱码字符
    const fixMap: Record<string, string> = {
      'ä¿': '保',
      'ä¹': '佑',
      'è§': '角',
      'è²': '色',
      'å': '名',
      'å¤': '外',
      'å·': '号',
      'å¸': '常',
      'å¨': '挂',
      'å´': '在',
      'å°´': '嘴',
      'è¾¹': '边',
      'ç': '的',
      'è¯': '话',
      'â': '"',
      '€': '"',
      '¼': ',',
      '½': '你',
      '¾': '少',
      '管': '管',
      'æ': '我',
      '¡': '！'
    };
    
    for (const [garbled, fixed] of Object.entries(fixMap)) {
      fixedString = fixedString.replace(new RegExp(garbled, 'g'), fixed);
    }
    
    console.log('手动修复完成');
    return fixedString;
  }
  
  /**
   * 修复 Unicode 转义序列
   */
  private static fixUnicodeEscapes(str: string): string {
    console.log('修复 Unicode 转义序列...');
    
    // 修复 \u 转义序列
    let fixedString = str.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    // 修复其他转义序列
    fixedString = fixedString.replace(/\\n/g, '\n');
    fixedString = fixedString.replace(/\\r/g, '\r');
    fixedString = fixedString.replace(/\\t/g, '\t');
    fixedString = fixedString.replace(/\\"/g, '"');
    fixedString = fixedString.replace(/\\\\/g, '\\');
    
    console.log('Unicode 转义序列修复完成');
    return fixedString;
  }
  
  /**
   * 检测字符串的编码类型
   */
  static detectEncoding(str: string): string {
    console.log('检测字符串编码...');
    
    // 检查是否包含中文字符
    const chinesePattern = /[\u4e00-\u9fff]/;
    if (chinesePattern.test(str)) {
      console.log('检测到中文字符');
      return 'utf-8';
    }
    
    // 检查是否包含乱码
    if (this.containsGarbledText(str)) {
      console.log('检测到乱码，可能是编码问题');
      return 'garbled';
    }
    
    // 检查是否包含 Unicode 转义序列
    if (str.includes('\\u')) {
      console.log('检测到 Unicode 转义序列');
      return 'unicode-escaped';
    }
    
    console.log('未检测到特殊编码问题');
    return 'unknown';
  }
} 