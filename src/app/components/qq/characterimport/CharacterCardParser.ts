import { SillyTavernCharacter, PNGParseResult } from './types';

// 定义解析数据的类型
interface ParsedCharacterData {
  name?: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  mes_example?: string;
  creator_notes?: string;
  tags?: string[];
  creator?: string;
  character_version?: string;
  alternate_greetings?: string[];
  extensions?: Record<string, unknown>;
  data?: ParsedCharacterData;
  spec?: string;
  spec_version?: string;
}

interface JSONParseResult {
  [key: number]: {
    image?: {
      properties?: {
        ccv3?: string;
        chara?: string;
      };
    };
  };
}

export class CharacterCardParser {
  /**
   * 解析 PNG 角色卡片文件
   */
  static async parsePNGFile(file: File): Promise<PNGParseResult> {
    try {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: '请选择图片文件'
        };
      }

      // 验证文件大小 (限制为 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return {
          success: false,
          error: '文件大小不能超过 10MB'
        };
      }

      // 读取文件为 Base64
      const imageData = await this.readFileAsBase64(file);
      
      // 解析 PNG 元数据
      const character = await this.extractCharacterData(file);
      
      if (!character) {
        return {
          success: false,
          error: '无法从文件中提取角色数据，请确保这是有效的 SillyTavern 角色卡片'
        };
      }

      return {
        success: true,
        character,
        imageData
      };

    } catch (error) {
      console.error('解析 PNG 文件失败:', error);
      return {
        success: false,
        error: `解析失败: ${error instanceof Error ? error.message : '未知错误'}`
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
        resolve(result);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 从 PNG 文件中提取角色数据
   */
  private static async extractCharacterData(file: File): Promise<SillyTavernCharacter | null> {
    try {
      // 读取文件内容
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 尝试解析 PNG 文件中的 tEXt 块
      const characterData = this.parsePNGTextChunks(uint8Array);
      
      if (characterData) {
        return characterData;
      }
      
      // 如果无法解析，创建默认角色数据
      return this.createDefaultCharacter(file.name);

    } catch (error) {
      console.error('提取角色数据失败:', error);
      return this.createDefaultCharacter(file.name);
    }
  }

  /**
   * 解析 PNG 文件中的 tEXt 块
   */
  private static parsePNGTextChunks(uint8Array: Uint8Array): SillyTavernCharacter | null {
    try {
      // PNG 文件头
      const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
      for (let i = 0; i < 8; i++) {
        if (uint8Array[i] !== pngSignature[i]) {
          return null; // 不是有效的 PNG 文件
        }
      }

      let offset = 8; // 跳过 PNG 签名
      
      while (offset < uint8Array.length - 8) {
        // 读取块长度
        const length = new DataView(uint8Array.buffer, offset, 4).getUint32(0, false);
        offset += 4;
        
        // 读取块类型
        const chunkType = String.fromCharCode(...uint8Array.slice(offset, offset + 4));
        offset += 4;
        
        if (chunkType === 'tEXt') {
          // 找到 tEXt 块，尝试解析
          const textData = new TextDecoder().decode(uint8Array.slice(offset, offset + length));
          const characterData = this.parseTextChunk(textData);
          if (characterData) {
            return characterData;
          }
        }
        
        // 跳过数据部分和 CRC
        offset += length + 4;
      }
      
      return null;
    } catch (error) {
      console.error('解析 PNG tEXt 块失败:', error);
      return null;
    }
  }

  /**
   * 解析 tEXt 块中的角色数据
   */
  private static parseTextChunk(textData: string): SillyTavernCharacter | null {
    try {
      // 查找 ccv3 或 chara 字段
      const ccv3Match = textData.match(/ccv3\0(.+?)(?=\0|$)/);
      const charaMatch = textData.match(/chara\0(.+?)(?=\0|$)/);
      
      const base64Data = ccv3Match?.[1] || charaMatch?.[1];
      if (!base64Data) {
        return null;
      }
      
      // 解码 Base64 数据
      const decodedData = this.decodeBase64JSON(base64Data);
      if (!decodedData) {
        return null;
      }
      
      // 构建角色对象
      return this.buildCharacterFromData(decodedData);
      
    } catch (error) {
      console.error('解析 tEXt 块失败:', error);
      return null;
    }
  }

  /**
   * 从解析的数据构建角色对象
   */
  private static buildCharacterFromData(data: ParsedCharacterData): SillyTavernCharacter {
    const characterData = data.data || data;
    
    return {
      name: characterData.name || '导入的角色',
      description: characterData.description || '',
      personality: characterData.personality || '',
      scenario: characterData.scenario || '',
      first_mes: characterData.first_mes || '',
      mes_example: characterData.mes_example || '',
      creator_notes: characterData.creator_notes || '',
      tags: characterData.tags || [],
      creator: characterData.creator || '未知',
      character_version: characterData.character_version || '1.0',
      alternate_greetings: characterData.alternate_greetings || [],
      extensions: characterData.extensions || {},
      spec: data.spec || 'SillyTavern',
      spec_version: data.spec_version || '1.0',
      data: {
        name: characterData.name || '导入的角色',
        description: characterData.description || '',
        personality: characterData.personality || '',
        scenario: characterData.scenario || '',
        first_mes: characterData.first_mes || '',
        mes_example: characterData.mes_example || '',
        creator_notes: characterData.creator_notes || '',
        tags: characterData.tags || [],
        creator: characterData.creator || '未知',
        character_version: characterData.character_version || '1.0',
        alternate_greetings: characterData.alternate_greetings || [],
        extensions: characterData.extensions || {}
      }
    };
  }

  /**
   * 创建默认角色数据
   */
  private static createDefaultCharacter(fileName: string): SillyTavernCharacter {
    const name = fileName.replace(/\.png$/i, '') || '导入的角色';
    
    return {
      name,
      description: `从 SillyTavern 角色卡片导入的角色：${name}`,
      personality: '这是一个从 SillyTavern 导入的角色，请手动设置角色人设。',
      scenario: '请设置场景背景',
      first_mes: `你好！我是 ${name}，从 SillyTavern 导入的角色。`,
      mes_example: '这是一个对话示例。',
      creator_notes: '从 SillyTavern 角色卡片导入',
      tags: ['导入', 'SillyTavern'],
      creator: '未知',
      character_version: '1.0',
      alternate_greetings: [],
      extensions: {},
      spec: 'SillyTavern',
      spec_version: '1.0',
      data: {
        name,
        description: `从 SillyTavern 角色卡片导入的角色：${name}`,
        personality: '这是一个从 SillyTavern 导入的角色，请手动设置角色人设。',
        scenario: '请设置场景背景',
        first_mes: `你好！我是 ${name}，从 SillyTavern 导入的角色。`,
        mes_example: '这是一个对话示例。',
        creator_notes: '从 SillyTavern 角色卡片导入',
        tags: ['导入', 'SillyTavern'],
        creator: '未知',
        character_version: '1.0',
        alternate_greetings: [],
        extensions: {}
      }
    };
  }

  /**
   * 从 JSON 解析结果中提取角色数据
   */
  private static extractCharacterFromJSON(jsonResult: JSONParseResult): SillyTavernCharacter | null {
    try {
      // 查找包含角色数据的属性
      const properties = jsonResult[0]?.image?.properties;
      if (!properties) {
        return null;
      }

      // 尝试从 ccv3 或 chara 字段中提取数据
      let characterData: ParsedCharacterData | null = null;
      
      if (properties.ccv3) {
        characterData = this.decodeBase64JSON(properties.ccv3);
      } else if (properties.chara) {
        characterData = this.decodeBase64JSON(properties.chara);
      }

      if (!characterData) {
        return null;
      }

      // 构建 SillyTavernCharacter 对象
      const character: SillyTavernCharacter = {
        name: characterData.name || characterData.data?.name || '',
        description: characterData.description || characterData.data?.description || '',
        personality: characterData.personality || characterData.data?.personality || '',
        scenario: characterData.scenario || characterData.data?.scenario || '',
        first_mes: characterData.first_mes || characterData.data?.first_mes || '',
        mes_example: characterData.mes_example || characterData.data?.mes_example || '',
        creator_notes: characterData.creator_notes || characterData.data?.creator_notes || '',
        tags: characterData.tags || characterData.data?.tags || [],
        creator: characterData.creator || characterData.data?.creator || '',
        character_version: characterData.character_version || characterData.data?.character_version || '',
        alternate_greetings: characterData.alternate_greetings || characterData.data?.alternate_greetings || [],
        extensions: characterData.extensions || characterData.data?.extensions || {},
        spec: characterData.spec || characterData.data?.spec || '',
        spec_version: characterData.spec_version || characterData.data?.spec_version || '',
        data: {
          name: characterData.name || characterData.data?.name || '',
          description: characterData.description || characterData.data?.description || '',
          personality: characterData.personality || characterData.data?.personality || '',
          scenario: characterData.scenario || characterData.data?.scenario || '',
          first_mes: characterData.first_mes || characterData.data?.first_mes || '',
          mes_example: characterData.mes_example || characterData.data?.mes_example || '',
          creator_notes: characterData.creator_notes || characterData.data?.creator_notes || '',
          tags: characterData.tags || characterData.data?.tags || [],
          creator: characterData.creator || characterData.data?.creator || '',
          character_version: characterData.character_version || characterData.data?.character_version || '',
          alternate_greetings: characterData.alternate_greetings || characterData.data?.alternate_greetings || [],
          extensions: characterData.extensions || characterData.data?.extensions || {}
        }
      };

      return character;

    } catch (error) {
      console.error('提取角色数据失败:', error);
      return null;
    }
  }

  /**
   * 解码 Base64 JSON 字符串
   */
  private static decodeBase64JSON(base64String: string): ParsedCharacterData | null {
    try {
      const decodedString = atob(base64String);
      return JSON.parse(decodedString);
    } catch (error) {
      console.error('Base64 解码失败:', error);
      return null;
    }
  }

  /**
   * 验证角色数据的完整性
   */
  static validateCharacter(character: SillyTavernCharacter): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!character.name || character.name.trim() === '') {
      errors.push('角色名称不能为空');
    }

    if (!character.personality || character.personality.trim() === '') {
      errors.push('角色人设不能为空');
    }

    if (!character.description || character.description.trim() === '') {
      errors.push('角色描述不能为空');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 