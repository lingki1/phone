import { Product, ChatAnalysis } from '../../types/shopping';
import { ChatItem } from '../../types/chat';
import { dataManager } from '../../utils/dataManager';

interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
}

interface AnalysisResult {
  keywords?: string[];
  interests?: string[];
  topics?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  productPreferences?: string[];
}

export class ProductGenerator {
  private apiConfig: ApiConfig;

  constructor(apiConfig: ApiConfig) {
    this.apiConfig = apiConfig;
  }

  // 强力解析JSON字符串，处理各种异常情况
  private parseJsonSafely(jsonString: string): unknown {
    if (!jsonString || jsonString.trim() === '') {
      console.warn('JSON字符串为空');
      return null;
    }

    let cleaned = jsonString.trim();
    
    // 移除markdown代码块标记
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // 移除开头和结尾的空白字符
    cleaned = cleaned.trim();
    
    // 如果字符串以```开头，移除它
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3).trim();
    }
    
    // 如果字符串以```结尾，移除它
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3).trim();
    }

    // 尝试直接解析
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('直接解析失败，尝试修复JSON:', error);
    }

    // 尝试修复不完整的JSON数组
    if (cleaned.startsWith('[') && !cleaned.endsWith(']')) {
      console.log('检测到不完整的JSON数组，尝试修复...');
      
      // 查找最后一个完整的对象
      const lastCompleteObject = this.findLastCompleteObject(cleaned);
      if (lastCompleteObject) {
        cleaned = cleaned.substring(0, lastCompleteObject.end) + ']';
        console.log('修复后的JSON:', cleaned);
        
        try {
          return JSON.parse(cleaned);
        } catch (error) {
          console.warn('修复后解析仍然失败:', error);
        }
      }
    }

    // 尝试提取JSON对象
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.warn('提取JSON对象失败:', error);
      }
    }

    // 尝试手动构建对象数组
    const objects = this.extractObjectsFromText(cleaned);
    if (objects.length > 0) {
      console.log('手动提取到对象:', objects.length, '个');
      return objects;
    }

    console.error('所有解析方法都失败了');
    return null;
  }

  // 查找最后一个完整的对象
  private findLastCompleteObject(text: string): { end: number } | null {
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            return { end: i + 1 };
          }
        }
      }
    }
    
    return null;
  }

  // 从文本中提取对象
  private extractObjectsFromText(text: string): unknown[] {
    const objects: unknown[] = [];
    const objectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    let match;
    
    while ((match = objectPattern.exec(text)) !== null) {
      try {
        const obj = JSON.parse(match[0]);
        if (obj && typeof obj === 'object' && obj.name) {
          objects.push(obj);
        }
      } catch {
        // 忽略解析失败的对象
      }
    }
    
    return objects;
  }

  // 分析聊天内容，提取用户兴趣和关键词
  async analyzeChatContent(chat: ChatItem): Promise<ChatAnalysis> {
    if (!this.apiConfig.proxyUrl || !this.apiConfig.apiKey || !this.apiConfig.model) {
      throw new Error('API配置不完整，无法分析聊天内容');
    }

    // 构建聊天历史文本
    const chatHistory = chat.messages
      .filter(msg => msg.role === 'user' && msg.content)
      .map(msg => msg.content)
      .join('\n');

    if (!chatHistory.trim()) {
      return {
        keywords: [],
        interests: [],
        topics: [],
        sentiment: 'neutral',
        productPreferences: []
      };
    }

    try {
      const response = await fetch(`${this.apiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: this.apiConfig.model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的用户兴趣分析专家。请分析用户的聊天内容，提取以下信息：

1. 关键词：用户提到的具体物品、品牌、概念等
2. 兴趣领域：用户感兴趣的领域，如科技、美食、旅行、运动等
3. 话题主题：聊天的主要话题
4. 情感倾向：positive（积极）、neutral（中性）、negative（消极）
5. 产品偏好：用户可能感兴趣的产品类型

请直接返回JSON格式，不要包含任何markdown标记或其他格式：

{
  "keywords": ["关键词1", "关键词2"],
  "interests": ["兴趣1", "兴趣2"],
  "topics": ["话题1", "话题2"],
  "sentiment": "positive|neutral|negative",
  "productPreferences": ["产品类型1", "产品类型2"]
}`
            },
            {
              role: 'user',
              content: `请分析以下聊天内容：\n\n${chatHistory}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      // 解析JSON响应
      const analysis = this.parseJsonSafely(analysisText) as AnalysisResult;
      if (analysis) {
        return {
          keywords: analysis.keywords || [],
          interests: analysis.interests || [],
          topics: analysis.topics || [],
          sentiment: analysis.sentiment || 'neutral',
          productPreferences: analysis.productPreferences || []
        };
      } else {
        console.error('解析分析结果失败');
        console.error('原始响应内容:', analysisText);
        return {
          keywords: [],
          interests: [],
          topics: [],
          sentiment: 'neutral',
          productPreferences: []
        };
      }
    } catch (error) {
      console.error('分析聊天内容失败:', error);
      return {
        keywords: [],
        interests: [],
        topics: [],
        sentiment: 'neutral',
        productPreferences: []
      };
    }
  }

  // 根据聊天分析生成相关商品
  async generateProducts(analysis: ChatAnalysis, maxProducts: number = 10): Promise<Product[]> {
    if (!this.apiConfig.proxyUrl || !this.apiConfig.apiKey || !this.apiConfig.model) {
      throw new Error('API配置不完整，无法生成商品');
    }

    try {
      const response = await fetch(`${this.apiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: this.apiConfig.model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的电商商品生成专家。根据用户的分析结果，生成相关的商品推荐。

请生成${maxProducts}个商品，每个商品包含以下信息：
- 商品名称：吸引人的商品名称
- 描述：详细的商品描述
- 价格：合理的价格（10-1000元之间）
- 原价：比现价高10-30%
- 分类：商品分类
- 标签：相关标签
- 评分：4.0-5.0之间的评分
- 评论数：10-1000之间的评论数
- 库存：10-100之间的库存数
- 是否促销：随机设置
- 折扣：如果是促销商品，设置10-50%的折扣

重要：请确保返回完整的JSON数组，不要截断。如果内容太长，请减少商品数量但确保每个商品信息完整。

请直接返回JSON数组格式，不要包含任何markdown标记或其他格式：

[
  {
    "name": "商品名称",
    "description": "商品描述",
    "price": 价格,
    "originalPrice": 原价,
    "category": "分类",
    "tags": ["标签1", "标签2"],
    "rating": 评分,
    "reviewCount": 评论数,
    "stock": 库存,
    "isOnSale": true/false,
    "discountPercentage": 折扣百分比
  }
]`
            },
            {
              role: 'user',
              content: `根据以下用户分析结果生成商品：

关键词：${analysis.keywords.join(', ')}
兴趣：${analysis.interests.join(', ')}
话题：${analysis.topics.join(', ')}
情感：${analysis.sentiment}
产品偏好：${analysis.productPreferences.join(', ')}

请生成${maxProducts}个相关的商品推荐。`
            }
          ],
          temperature: 0.7,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const productsText = data.choices[0].message.content;
      
      // 解析JSON响应
              const rawProducts = this.parseJsonSafely(productsText) as unknown[];
      if (rawProducts && Array.isArray(rawProducts)) {
        const products: Product[] = rawProducts.map((rawProduct: unknown, index: number) => {
          const product = rawProduct as Record<string, unknown>;
          return {
            id: `product_${Date.now()}_${index}`,
            name: (product.name as string) || `商品${index + 1}`,
            description: (product.description as string) || '暂无描述',
            price: parseFloat(product.price as string) || 99,
            originalPrice: product.originalPrice ? parseFloat(product.originalPrice as string) : undefined,
            image: '📦', // 默认图片，保持兼容性
            category: (product.category as string) || '其他',
            tags: Array.isArray(product.tags) ? product.tags as string[] : [],
            rating: parseFloat(product.rating as string) || 4.5,
            reviewCount: parseInt(product.reviewCount as string) || 100,
            stock: parseInt(product.stock as string) || 50,
            isOnSale: Boolean(product.isOnSale),
            discountPercentage: product.discountPercentage ? parseInt(product.discountPercentage as string) : undefined,
            createdAt: Date.now(),
            relatedChatIds: [],
            generatedFrom: `基于用户兴趣：${analysis.interests.join(', ')}`
          };
        });

        return products;
      } else {
        console.error('解析商品数据失败');
        console.error('原始响应内容:', productsText);
        return [];
      }
    } catch (error) {
      console.error('生成商品失败:', error);
      return [];
    }
  }

  // 获取所有聊天并生成相关商品
  async generateProductsFromAllChats(): Promise<Product[]> {
    try {
      await dataManager.initDB();
      const allChats = await dataManager.getAllChats();
      
      const allProducts: Product[] = [];
      
      for (const chat of allChats) {
        if (chat.messages.length === 0) continue;
        
        try {
          // 分析聊天内容
          const analysis = await this.analyzeChatContent(chat);
          
          // 生成相关商品
          const products = await this.generateProducts(analysis, 2);
          
          // 关联聊天ID
          products.forEach(product => {
            product.relatedChatIds = [chat.id];
          });
          
          allProducts.push(...products);
        } catch (error) {
          console.error(`处理聊天 ${chat.id} 失败:`, error);
        }
      }
      
      return allProducts;
    } catch (error) {
      console.error('从聊天生成商品失败:', error);
      return [];
    }
  }

  // 根据特定聊天生成商品
  async generateProductsFromChat(chatId: string): Promise<Product[]> {
    try {
      await dataManager.initDB();
      const chat = await dataManager.getChat(chatId);
      
      if (!chat || chat.messages.length === 0) {
        return [];
      }
      
      // 分析聊天内容
      const analysis = await this.analyzeChatContent(chat);
      
      // 生成相关商品
      const products = await this.generateProducts(analysis, 3);
      
      // 关联聊天ID
      products.forEach(product => {
        product.relatedChatIds = [chatId];
      });
      
      return products;
    } catch (error) {
      console.error(`从聊天 ${chatId} 生成商品失败:`, error);
      return [];
    }
  }
} 