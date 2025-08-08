import { Product } from '../../types/shopping';

interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string; // 添加model字段
}

// 删除未使用的PRESET_PRODUCTS常量

export class ProductGenerator {
  private apiConfig: ApiConfig;
  private aiGeneratedProducts: Product[] = [];
  private isGenerating: boolean = false;

  constructor(apiConfig: ApiConfig) {
    this.apiConfig = apiConfig;
  }

  // 从JSON文件获取预设商品
  async getPresetProducts(): Promise<Product[]> {
    try {
      const response = await fetch('/shopping/preset-products.json');
      if (!response.ok) {
        throw new Error('Failed to load preset products');
      }
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('加载预设商品失败，使用备用商品:', error);
      // 如果加载失败，返回备用商品
      return this.getFallbackProducts();
    }
  }

  // 备用商品（当JSON文件加载失败时使用）
  private getFallbackProducts(): Product[] {
    return [
      {
        id: 'fallback_001',
        name: '智能手表',
        description: '功能强大的智能手表，支持健康监测和运动追踪',
        price: 299.99,
        originalPrice: 399.99,
        image: '📦',
        category: '电子产品',
        tags: ['智能', '健康', '运动'],
        rating: 4.5,
        reviewCount: 128,
        stock: 50,
        isOnSale: true,
        discountPercentage: 25,
        createdAt: Date.now(),
        relatedChatIds: [],
        generatedFrom: '预设商品'
      },
      {
        id: 'fallback_002',
        name: '无线耳机',
        description: '高品质无线蓝牙耳机，音质清晰，续航持久',
        price: 199.99,
        originalPrice: 249.99,
        image: '📦',
        category: '电子产品',
        tags: ['无线', '蓝牙', '音质'],
        rating: 4.3,
        reviewCount: 89,
        stock: 30,
        isOnSale: true,
        discountPercentage: 20,
        createdAt: Date.now(),
        relatedChatIds: [],
        generatedFrom: '预设商品'
      }
    ];
  }

  // 获取所有商品（预设 + AI生成）
  async getAllProducts(): Promise<Product[]> {
    const presetProducts = await this.getPresetProducts();
    return [...presetProducts, ...this.aiGeneratedProducts];
  }

  // 清除AI生成的商品
  clearAiGeneratedProducts(): void {
    this.aiGeneratedProducts = [];
  }

  // 获取生成状态
  getGeneratingStatus(): boolean {
    return this.isGenerating;
  }

  // 获取AI生成商品数量
  getAiGeneratedCount(): number {
    return this.aiGeneratedProducts.length;
  }

  // 获取AI生成的商品列表
  getAiGeneratedProducts(): Product[] {
    return [...this.aiGeneratedProducts];
  }

  // 获取预设商品数量
  async getPresetCount(): Promise<number> {
    const presetProducts = await this.getPresetProducts();
    return presetProducts.length;
  }

  // 根据搜索词生成商品
  async generateProductsForSearch(searchTerm: string, maxProducts: number = 5): Promise<Product[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    // 检查是否已经在生成中
    if (this.isGenerating) {
      console.log('AI生成正在进行中，跳过重复请求');
      return [];
    }

    // 检查是否已经有相同搜索词的AI商品
    const existingAiProducts = this.aiGeneratedProducts.filter(product => 
      product.generatedFrom.includes(searchTerm)
    );
    
    if (existingAiProducts.length > 0) {
      console.log('已存在相同搜索词的AI商品，返回现有结果');
      return existingAiProducts;
    }

    // 检查API配置
    if (!this.apiConfig.proxyUrl || !this.apiConfig.apiKey || !this.apiConfig.model) {
      console.error('API配置不完整:', {
        hasProxyUrl: !!this.apiConfig.proxyUrl,
        hasApiKey: !!this.apiConfig.apiKey,
        hasModel: !!this.apiConfig.model
      });
      throw new Error('API配置不完整，请检查代理地址、API密钥和模型设置');
    }

    this.isGenerating = true;

    try {
      const currentTime = Date.now();
      
      // 简化的系统提示词
      const systemPrompt = `你是一个专业的电商商品生成专家，专门为女性用户生成相关商品。

要求：
1. 严格按照JSON格式返回，不要包含任何其他文字
2. 商品要针对女性用户需求
3. 价格要合理，符合商品价值
4. 描述要详细且吸引人
5. 标签要准确相关

返回格式：
{
  "products": [
    {
      "id": "ai_001",
      "name": "商品名称",
      "description": "商品描述",
      "price": 价格,
      "originalPrice": 原价,
      "image": "相关emoji",
      "category": "商品类别",
      "tags": ["标签1", "标签2", "标签3", "标签4"],
      "rating": 评分,
      "reviewCount": 评论数量,
      "stock": 库存,
      "isOnSale": true,
      "discountPercentage": 折扣百分比,
      "createdAt": ${currentTime},
      "relatedChatIds": [],
      "generatedFrom": "AI搜索生成：${searchTerm}"
    }
  ]
}`;

      // 简化的用户提示词
      const userPrompt = `请根据搜索词"${searchTerm}"生成${maxProducts}个相关的女性商品。

商品要求：
- 价格：50-1500元之间
- 原价：比现价高20-50%
- 类别：美容护肤、时尚服饰、健康设备、家居生活、智能家居、运动健身、时尚配饰等
- 评分：4.0-5.0之间
- 评论数量：50-3000之间
- 库存：20-500之间
- 折扣：20-50%之间

请直接返回JSON格式，不要包含任何其他文字。`;

      console.log('🔍 购物搜索 - 开始API调用:', {
        url: `${this.apiConfig.proxyUrl}/v1/chat/completions`,
        model: this.apiConfig.model,
        searchTerm,
        maxProducts,
        hasApiKey: !!this.apiConfig.apiKey
      });

      const requestBody = {
        model: this.apiConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 10000, // 设置为10000，避免内容截断
        top_p: 0.8,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      // 检查请求体大小
      const requestBodySize = JSON.stringify(requestBody).length;
      console.log(`📊 请求体大小: ${requestBodySize} 字符`);
      
      if (requestBodySize > 8000) {
        console.warn('⚠️ 请求体过大，进行简化处理');
        // 进一步简化提示词
        requestBody.messages[1].content = `请根据搜索词"${searchTerm}"生成${maxProducts}个相关的女性商品，价格50-1500元，直接返回JSON格式。`;
      }

      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 API调用尝试 ${attempt}/${maxRetries}`);
          
          const response = await fetch(`${this.apiConfig.proxyUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiConfig.apiKey}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            // 添加超时设置，最多等待3分钟
            signal: AbortSignal.timeout(180000)
          });

          console.log(`📥 响应状态: ${response.status} ${response.statusText}`);

          if (response.status === 413) {
            throw new Error('请求内容过大，请减少输入数据');
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API请求失败: ${response.status} ${response.statusText}`, errorText.substring(0, 200));
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const responseText = await response.text();
            console.error('❌ 响应不是JSON格式:', contentType, responseText.substring(0, 200));
            throw new Error(`API返回了非JSON格式: ${contentType}`);
          }

          const data = await response.json();
          console.log('💬 API响应数据:', JSON.stringify(data, null, 2));

          const content = data.choices?.[0]?.message?.content;

          if (!content) {
            throw new Error('API返回内容为空');
          }

          console.log('AI生成的内容:', content);

          // 解析JSON内容
          const parsedData = this.parseJsonFromContent(content);
          
          if (parsedData && parsedData.products && Array.isArray(parsedData.products)) {
            const newProducts = parsedData.products.slice(0, maxProducts);
            
            // 验证和修复商品数据
            const validatedProducts = newProducts.map((product: Product, index: number) => ({
              id: product.id || `ai_${currentTime}_${index}`,
              name: product.name || `AI商品${index + 1}`,
              description: product.description || '暂无描述',
              price: parseFloat(String(product.price)) || 99.99,
              originalPrice: product.originalPrice ? parseFloat(String(product.originalPrice)) : undefined,
              image: product.image || this.getRandomProductEmoji(),
              category: product.category || '其他',
              tags: Array.isArray(product.tags) ? product.tags : [],
              rating: parseFloat(String(product.rating)) || 4.5,
              reviewCount: parseInt(String(product.reviewCount)) || 100,
              stock: parseInt(String(product.stock)) || 50,
              isOnSale: Boolean(product.isOnSale),
              discountPercentage: product.discountPercentage ? parseInt(String(product.discountPercentage)) : undefined,
              createdAt: product.createdAt || currentTime,
              relatedChatIds: [],
              generatedFrom: product.generatedFrom || `AI搜索生成：${searchTerm}`
            }));
            
            // 添加到AI生成商品列表
            this.aiGeneratedProducts.push(...validatedProducts);
            
            console.log('✅ 成功生成商品:', validatedProducts.length, '个');
            return validatedProducts;
          } else {
            throw new Error('解析商品数据失败');
          }

        } catch (error) {
          console.error(`❌ 第${attempt}次API调用失败:`, error);
          lastError = error as Error;
          
          if (attempt < maxRetries) {
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      // 所有重试都失败了
      throw lastError || new Error('API调用失败');

    } catch (error) {
      console.error('❌ AI生成商品失败:', error);
      return [];
    } finally {
      this.isGenerating = false;
    }
  }

  // 从API响应中解析JSON
  private parseJsonFromContent(content: string): { products: Product[] } | null {
    console.log('开始解析JSON内容:', content.substring(0, 200) + '...');
    
    try {
      // 尝试直接解析
      return JSON.parse(content);
    } catch {
      console.log('直接解析失败，尝试提取JSON部分');
      
      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          console.error('提取JSON失败');
        }
      }
      
      // 如果还是失败，尝试修复常见的JSON格式问题
      try {
        console.log('尝试修复JSON格式');
        let fixedContent = content
          .replace(/,\s*}/g, '}')  // 移除末尾多余的逗号
          .replace(/,\s*]/g, ']')  // 移除数组末尾多余的逗号
          .replace(/`/g, '"')      // 替换反引号为双引号
          .replace(/'/g, '"')      // 替换单引号为双引号
          .replace(/\n/g, ' ')     // 移除换行符
          .replace(/\r/g, ' ')     // 移除回车符
          .replace(/\t/g, ' ')     // 移除制表符
          .trim();
        
        // 尝试找到JSON对象的开始和结束
        const startIndex = fixedContent.indexOf('{');
        const endIndex = fixedContent.lastIndexOf('}');
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          fixedContent = fixedContent.substring(startIndex, endIndex + 1);
        }
        
        console.log('修复后的内容:', fixedContent.substring(0, 200) + '...');
        return JSON.parse(fixedContent);
      } catch {
        console.error('修复JSON格式失败');
        
        // 最后的尝试：手动构建商品对象
        console.log('尝试手动构建商品对象');
        return this.buildFallbackProducts();
      }
    }
  }

  // 构建备用商品（当JSON解析完全失败时）
  private buildFallbackProducts(): { products: Product[] } {
    return {
      products: [
        {
          id: `ai_fallback_${Date.now()}`,
          name: "智能商品",
          description: "这是一个AI生成的智能商品，具有多种功能",
          price: 199.99,
          originalPrice: 299.99,
          image: "📦",
          category: "电子产品",
          tags: ["智能", "多功能", "实用", "创新"],
          rating: 4.5,
          reviewCount: 150,
          stock: 100,
          isOnSale: true,
          discountPercentage: 33,
          createdAt: Date.now(),
          relatedChatIds: [],
          generatedFrom: "AI搜索生成：备用商品"
        }
      ]
    };
  }

  // 获取随机商品emoji（用于AI生成商品）
  private getRandomProductEmoji(): string {
    const emojis = ['📦', '💄', '👗', '👜', '💎', '🧴', '🪞', '💆‍♀️', '🧘‍♀️', '🏃‍♀️', '💺', '🌹', '☀️', '👁️', '🪥', '💧', '🎭', '🧼', '💦', '👠', '🧣', '🕶️', '🧤', '💍', '👙', '⚖️', '⌚', '🔫', '⚽', '🏋️‍♀️', '🤖', '🪟', '🚽', '🔊', '🔐', '🌬️', '☕', '💨'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }
} 