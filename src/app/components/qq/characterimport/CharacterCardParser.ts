import { SillyTavernCharacter, CharacterParseResult } from './types';
import { PNGDebugger } from './debug';
import { EncodingFixer } from './encoding-fix';
import { compressImage } from '../../../utils/imageCompressor';

export class CharacterCardParser {
  /**
   * 解析 PNG 角色卡片文件
   */
  static async parseCharacterCard(file: File): Promise<CharacterParseResult> {
    try {
      console.log('开始解析角色卡片:', file.name, '大小:', file.size);
      
      // 1. 验证文件类型
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: '请选择图片文件'
        };
      }

      // 2. 读取文件为 Base64
      const base64Data = await this.readFileAsBase64(file);
      console.log('文件读取完成，Base64 长度:', base64Data.length);
      
      // 调试：分析 PNG 结构
      PNGDebugger.analyzePNGStructure(base64Data);
      
      // 3. 提取 PNG 元数据
      const metadata = await this.extractPNGMetadata(base64Data);
      console.log('元数据提取完成，长度:', metadata.length);
      console.log('元数据预览:', metadata.substring(0, 100));
      
      // 4. 解析 SillyTavern 角色数据
      const character = this.parseSillyTavernData(metadata);
      console.log('角色数据解析完成:', character.name);
      
      // 5. 提取并压缩图像数据
      const imageData = await this.extractImageData(base64Data);

      return {
        success: true,
        character,
        imageData
      };
    } catch (error) {
      console.error('解析角色卡片失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '解析失败'
      };
    }
  }

  /**
   * 将文件读取为 Base64
   */
  private static readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/png;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 提取 PNG 元数据
   */
  private static async extractPNGMetadata(base64Data: string): Promise<string> {
    try {
      // 解码 Base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 查找 tEXt 块（SillyTavern 存储角色数据的地方）
      const textChunks = this.findTextChunks(bytes);
      
      // 查找 character 数据 - 支持多种可能的键名
      const possibleKeys = ['chara', 'character', 'description', 'data'];
      
      for (const chunk of textChunks) {
        if (possibleKeys.includes(chunk.keyword.toLowerCase())) {
          console.log(`找到角色数据块: ${chunk.keyword}`);
          return chunk.text;
        }
      }

      // 尝试从 JSON 格式的元数据中提取 ccv3 字段
      for (const chunk of textChunks) {
        try {
          const jsonData = JSON.parse(chunk.text);
          if (jsonData.ccv3) {
            console.log(`找到 ccv3 字段，长度: ${jsonData.ccv3.length}`);
            return jsonData.ccv3;
          }
          if (jsonData.chara) {
            console.log(`找到 chara 字段，长度: ${jsonData.chara.length}`);
            return jsonData.chara;
          }
          // 检查 ImageMagick 格式的 JSON 结构
          if (Array.isArray(jsonData) && jsonData[0] && jsonData[0].image && jsonData[0].image.properties) {
            if (jsonData[0].image.properties.ccv3) {
              console.log(`找到 ImageMagick ccv3 字段，长度: ${jsonData[0].image.properties.ccv3.length}`);
              return jsonData[0].image.properties.ccv3;
            }
            if (jsonData[0].image.properties.chara) {
              console.log(`找到 ImageMagick chara 字段，长度: ${jsonData[0].image.properties.chara.length}`);
              return jsonData[0].image.properties.chara;
            }
          }
        } catch {
          // 不是有效的 JSON，继续查找
          continue;
        }
      }

      // 如果没有找到标准键名，尝试查找包含 JSON 数据的块
      for (const chunk of textChunks) {
        if (chunk.text.trim().startsWith('{') || chunk.text.trim().startsWith('eyJ')) {
          console.log(`找到可能的角色数据块: ${chunk.keyword}`);
          return chunk.text;
        }
      }

      // 调试信息：输出所有找到的文本块
      console.log('找到的文本块:', textChunks.map(chunk => ({ keyword: chunk.keyword, preview: chunk.text.substring(0, 50) })));
      
      throw new Error('未找到角色数据');
    } catch (error) {
      throw new Error('PNG 元数据提取失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  /**
   * 查找 PNG 中的文本块
   */
  private static findTextChunks(bytes: Uint8Array): Array<{keyword: string, text: string}> {
    const chunks: Array<{keyword: string, text: string}> = [];
    let offset = 8; // 跳过 PNG 签名

    while (offset < bytes.length - 12) { // 确保有足够的数据读取块头
      // 读取块长度
      const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | 
                     (bytes[offset + 2] << 8) | bytes[offset + 3];
      
      // 读取块类型
      const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], 
                                      bytes[offset + 6], bytes[offset + 7]);
      
      console.log(`发现 PNG 块: ${type}, 长度: ${length}`);
      
      if (type === 'tEXt' || type === 'iTXt') {
        const dataStart = offset + 8;
        const data = bytes.slice(dataStart, dataStart + length);
        
        if (type === 'tEXt') {
          // 处理 tEXt 块
          const nullIndex = data.indexOf(0);
          if (nullIndex !== -1) {
            const keyword = new TextDecoder().decode(data.slice(0, nullIndex));
            const text = new TextDecoder().decode(data.slice(nullIndex + 1));
            console.log(`tEXt 块: ${keyword}, 内容长度: ${text.length}`);
            chunks.push({ keyword, text });
          }
        } else if (type === 'iTXt') {
          // 处理 iTXt 块（国际化文本）
          const nullIndex = data.indexOf(0);
          if (nullIndex !== -1) {
            const keyword = new TextDecoder().decode(data.slice(0, nullIndex));
            // 跳过压缩标志和语言标签
            let textStart = nullIndex + 1;
            while (textStart < data.length && data[textStart] !== 0) textStart++;
            textStart++;
            while (textStart < data.length && data[textStart] !== 0) textStart++;
            textStart++;
            
            const text = new TextDecoder().decode(data.slice(textStart));
            console.log(`iTXt 块: ${keyword}, 内容长度: ${text.length}`);
            chunks.push({ keyword, text });
          }
        }
      }
      
      // 移动到下一个块
      offset += 12 + length; // 8字节头部 + 4字节CRC
      
      // 安全检查：防止无限循环
      if (length < 0 || length > bytes.length) {
        console.warn('无效的块长度，停止解析');
        break;
      }
    }

    console.log(`总共找到 ${chunks.length} 个文本块`);
    return chunks;
  }

  /**
   * 解析 SillyTavern 角色数据
   */
  private static parseSillyTavernData(metadata: string): SillyTavernCharacter {
    try {
      let character: Record<string, unknown>;
      
      // 首先尝试 Base64 解码
      try {
        const decodedData = atob(metadata);
        console.log('Base64 解码后数据长度:', decodedData.length);
        console.log('Base64 解码后数据预览:', decodedData.substring(0, 200));
        
        // 检测编码类型
        const encodingType = EncodingFixer.detectEncoding(decodedData);
        console.log('检测到的编码类型:', encodingType);
        
        // 尝试修复编码问题
        const jsonString = decodedData;
        
        // 检查是否是 UTF-8 编码问题
        try {
          // 尝试直接解析
          character = JSON.parse(jsonString);
          
          // 检查解析后的数据是否包含乱码
          const hasGarbledText = this.checkForGarbledText(character);
          if (hasGarbledText) {
            console.log('检测到解析后的数据包含乱码，尝试修复编码...');
            
            // 使用编码修复工具
            try {
              const fixedString = EncodingFixer.fixEncoding(decodedData);
              character = JSON.parse(fixedString);
              console.log('使用编码修复工具修复成功');
            } catch {
              console.log('编码修复失败，保持原始解析结果');
            }
          }
        } catch {
          console.log('直接解析失败，尝试修复编码...');
          
          // 使用编码修复工具
          try {
            const fixedString = EncodingFixer.fixEncoding(decodedData);
            character = JSON.parse(fixedString);
            console.log('使用编码修复工具修复成功');
          } catch {
            console.log('编码修复失败，尝试原始数据解析');
            character = JSON.parse(jsonString);
          }
        }
      } catch {
        console.log('Base64 解码失败，尝试直接解析 JSON');
        // 如果 Base64 解码失败，尝试直接解析 JSON
        try {
          character = JSON.parse(metadata);
        } catch {
          throw new Error('无法解析角色数据：既不是有效的 Base64 编码，也不是有效的 JSON 格式');
        }
      }
      
      console.log('解析到的角色数据:', character);
      
      // 处理 SillyTavern v2 和 CCV3 格式
      let characterData: Record<string, unknown> = character;
      if (character.data) {
        if (character.spec === 'chara_card_v2') {
          console.log('检测到 SillyTavern v2 格式，提取 data 字段');
          characterData = character.data as Record<string, unknown>;
        } else if (character.spec === 'chara_card_v3') {
          console.log('检测到 CCV3 格式，提取 data 字段');
          characterData = character.data as Record<string, unknown>;
        }
      }
      
      console.log('实际角色数据:', characterData);
      
      // 检查可能的名称字段
      const possibleNameFields = ['name', 'title', 'character_name', 'char_name'];
      let characterName = '';
      
      for (const field of possibleNameFields) {
        if (characterData[field] && typeof characterData[field] === 'string') {
          characterName = characterData[field] as string;
          console.log(`找到角色名称字段: ${field} = ${characterName}`);
          break;
        }
      }
      
      // 验证必要字段
      if (!characterName) {
        console.error('角色数据中未找到名称字段，可用字段:', Object.keys(characterData));
        throw new Error('角色名称缺失');
      }

      // 获取描述信息
      const description = (characterData.description || characterData.desc || '') as string;
      
      // 如果 personality 为空，但有 description，则将 description 作为 personality
      let personality = (characterData.personality || characterData.char_persona || '') as string;
      if (!personality.trim() && description.trim()) {
        console.log('personality 字段为空，使用 description 作为人设');
        personality = description;
      }
      
      // 返回标准化的角色数据
      return {
        name: characterName,
        description,
        personality,
        scenario: (characterData.scenario || characterData.context || '') as string,
        first_mes: (characterData.first_mes || characterData.greeting || '') as string,
        mes_example: (characterData.mes_example || characterData.example_dialogue || '') as string,
        creator_notes: (characterData.creator_notes || characterData.notes || '') as string,
        tags: (characterData.tags || []) as string[],
        creator: (characterData.creator || characterData.author || '') as string,
        character_version: (characterData.character_version || characterData.version || '') as string,
        alternate_greetings: (characterData.alternate_greetings || characterData.greetings || []) as string[],
        post_history_instructions: (characterData.post_history_instructions || characterData.post_history || '') as string,
        world_scenario: (characterData.world_scenario || characterData.world || '') as string,
        character_book: (characterData.character_book || characterData.book || '') as string,
        extensions: characterData.extensions ? (characterData.extensions as Record<string, unknown>) : {}
      };
    } catch (error) {
      throw new Error('SillyTavern 数据解析失败: ' + (error instanceof Error ? error.message : '解析错误'));
    }
  }

  /**
   * 提取并压缩图像数据
   */
  private static async extractImageData(base64Data: string): Promise<string> {
    try {
      // 创建原始图片的 File 对象用于压缩
      const base64String = `data:image/png;base64,${base64Data}`;
      
      // 将 base64 转换为 Blob
      const response = await fetch(base64String);
      const blob = await response.blob();
      
      // 创建 File 对象
      const file = new File([blob], 'character-avatar.png', { type: 'image/png' });
      
      // 压缩图片
      const compressedImage = await compressImage(file, {
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400,
        maxSize: 1 * 1024 * 1024 // 压缩到1MB以下
      });
      
      console.log('角色头像压缩完成');
      return compressedImage;
    } catch (error) {
      console.error('图片压缩失败，使用原始图片:', error);
      // 如果压缩失败，返回原始图片
      return `data:image/png;base64,${base64Data}`;
    }
  }

  /**
   * 检查对象中是否包含乱码文本
   */
  private static checkForGarbledText(obj: unknown): boolean {
    const checkString = (str: string): boolean => {
      if (typeof str !== 'string') return false;
      
      // 检查常见的乱码模式
      const garbledPatterns = [
        /ä¿\x9E/,
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
    };
    
    const checkObject = (obj: unknown): boolean => {
      if (typeof obj === 'string') {
        return checkString(obj);
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const objRecord = obj as Record<string, unknown>;
        for (const key in objRecord) {
          if (checkObject(objRecord[key])) {
            return true;
          }
        }
      }
      
      if (Array.isArray(obj)) {
        return obj.some(item => checkObject(item));
      }
      
      return false;
    };
    
    return checkObject(obj);
  }

  /**
   * 验证角色数据完整性
   */
  static validateCharacter(character: SillyTavernCharacter): string[] {
    const errors: string[] = [];
    
    if (!character.name.trim()) {
      errors.push('角色名称不能为空');
    }
    
    // 检查人设：personality 或 description 至少有一个不为空
    if (!character.personality.trim() && !character.description.trim()) {
      errors.push('角色人设不能为空（personality 和 description 都为空）');
    }
    
    return errors;
  }
} 