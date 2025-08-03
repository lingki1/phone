/**
 * PNG 文件调试工具
 */
export class PNGDebugger {
  /**
   * 分析 PNG 文件结构
   */
  static analyzePNGStructure(base64Data: string): void {
    try {
      console.log('=== PNG 文件结构分析 ===');
      
      // 解码 Base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log('文件总大小:', bytes.length, '字节');
      
      // 检查 PNG 签名
      const signature = bytes.slice(0, 8);
      const signatureHex = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join(' ');
      console.log('PNG 签名:', signatureHex);
      
      if (signatureHex !== '89 50 4e 47 0d 0a 1a 0a') {
        console.error('无效的 PNG 签名');
        return;
      }

      // 分析所有块
      let offset = 8;
      let chunkCount = 0;
      
      while (offset < bytes.length - 12) {
        const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | 
                       (bytes[offset + 2] << 8) | bytes[offset + 3];
        
        const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], 
                                        bytes[offset + 6], bytes[offset + 7]);
        
        console.log(`块 ${chunkCount + 1}: ${type}, 长度: ${length}, 偏移: ${offset}`);
        
        if (type === 'tEXt' || type === 'iTXt') {
          const dataStart = offset + 8;
          const data = bytes.slice(dataStart, dataStart + length);
          
          if (type === 'tEXt') {
            const nullIndex = data.indexOf(0);
            if (nullIndex !== -1) {
              const keyword = new TextDecoder().decode(data.slice(0, nullIndex));
              const text = new TextDecoder().decode(data.slice(nullIndex + 1));
              console.log(`  tEXt 块: ${keyword}`);
              console.log(`  内容长度: ${text.length}`);
              console.log(`  内容预览: ${text.substring(0, 100)}...`);
              
              // 检查是否是 Base64 编码
              if (text.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
                console.log(`  检测到 Base64 编码`);
                try {
                  const decoded = atob(text);
                  console.log(`  Base64 解码后长度: ${decoded.length}`);
                  console.log(`  解码后预览: ${decoded.substring(0, 100)}...`);
                  
                  // 尝试解析 JSON
                  try {
                    const jsonData = JSON.parse(decoded);
                    console.log(`  JSON 解析成功，字段:`, Object.keys(jsonData));
                    this.analyzeCharacterData(jsonData);
                  } catch (jsonError) {
                    console.log(`  JSON 解析失败:`, jsonError);
                  }
                } catch (e) {
                  console.log(`  Base64 解码失败:`, e);
                }
              }
            }
          } else if (type === 'iTXt') {
            const nullIndex = data.indexOf(0);
            if (nullIndex !== -1) {
              const keyword = new TextDecoder().decode(data.slice(0, nullIndex));
              console.log(`  iTXt 块: ${keyword}`);
              
              // 跳过压缩标志和语言标签
              let textStart = nullIndex + 1;
              while (textStart < data.length && data[textStart] !== 0) textStart++;
              textStart++;
              while (textStart < data.length && data[textStart] !== 0) textStart++;
              textStart++;
              
              const text = new TextDecoder().decode(data.slice(textStart));
              console.log(`  内容长度: ${text.length}`);
              console.log(`  内容预览: ${text.substring(0, 100)}...`);
            }
          }
        }
        
        offset += 12 + length;
        chunkCount++;
        
        // 安全检查
        if (length < 0 || length > bytes.length) {
          console.warn('无效的块长度，停止分析');
          break;
        }
      }
      
      console.log(`总共分析 ${chunkCount} 个块`);
      console.log('=== 分析完成 ===');
      
    } catch (error) {
      console.error('PNG 分析失败:', error);
    }
  }

  /**
   * 分析角色数据结构
   */
  static analyzeCharacterData(data: Record<string, unknown>): void {
    console.log('=== 角色数据结构分析 ===');
    console.log('所有字段:', Object.keys(data));
    
    // 检查名称字段
    const nameFields = ['name', 'title', 'character_name', 'char_name'];
    for (const field of nameFields) {
      if (data[field]) {
        console.log(`找到名称字段 "${field}":`, data[field]);
      }
    }
    
    // 检查描述字段
    const descFields = ['description', 'desc'];
    for (const field of descFields) {
      if (data[field] && typeof data[field] === 'string') {
        console.log(`找到描述字段 "${field}":`, (data[field] as string).substring(0, 100) + '...');
      }
    }
    
    // 检查人设字段
    const personaFields = ['personality', 'char_persona'];
    for (const field of personaFields) {
      if (data[field] && typeof data[field] === 'string') {
        console.log(`找到人设字段 "${field}":`, (data[field] as string).substring(0, 100) + '...');
      }
    }
    
    console.log('=== 角色数据分析完成 ===');
  }
} 