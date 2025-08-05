// API调试工具
import { dataManager } from '../../../utils/dataManager';
import { ApiConfig } from '../../../types/chat';

export interface ApiDebugResult {
  success: boolean;
  message: string;
  details?: {
    config?: Partial<ApiConfig>;
    responseStatus?: number;
    responseText?: string;
    error?: string;
  };
}

export class ApiDebugger {
  // 测试API配置
  static async testApiConfig(): Promise<ApiDebugResult> {
    try {
      console.log('🔧 开始API配置测试');
      
      // 1. 获取配置
      const apiConfig = await dataManager.getApiConfig();
      console.log('📋 当前API配置:', {
        proxyUrl: apiConfig.proxyUrl,
        model: apiConfig.model,
        hasApiKey: !!apiConfig.apiKey
      });

      // 2. 验证配置完整性
      if (!apiConfig.proxyUrl) {
        return {
          success: false,
          message: '❌ 缺少API代理地址',
          details: { config: apiConfig }
        };
      }

      if (!apiConfig.apiKey) {
        return {
          success: false,
          message: '❌ 缺少API密钥',
          details: { config: apiConfig }
        };
      }

      // 3. 测试API连接
      console.log('🌐 测试API连接...');
      const testResponse = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: '请回复"测试成功"'
            }
          ],
          max_tokens: 10,
          temperature: 0.1,
          top_p: 0.8
        })
      });

      console.log('📥 响应状态:', testResponse.status, testResponse.statusText);
      console.log('📥 响应头:', Object.fromEntries(testResponse.headers.entries()));

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('❌ API请求失败:', errorText);
        
        return {
          success: false,
          message: `❌ API请求失败: ${testResponse.status} ${testResponse.statusText}`,
          details: {
            config: apiConfig,
            responseStatus: testResponse.status,
            responseText: errorText.substring(0, 500)
          }
        };
      }

      // 4. 检查响应格式
      const contentType = testResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await testResponse.text();
        console.error('❌ 响应不是JSON格式:', responseText);
        
        return {
          success: false,
          message: `❌ API返回了非JSON格式: ${contentType}`,
          details: {
            config: apiConfig,
            responseStatus: testResponse.status,
            responseText: responseText.substring(0, 500)
          }
        };
      }

      // 5. 解析响应
      const data = await testResponse.json();
      console.log('✅ API响应:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        return {
          success: false,
          message: '❌ API响应格式错误: 缺少choices或message字段',
          details: {
            config: apiConfig,
            responseStatus: testResponse.status,
            responseText: JSON.stringify(data)
          }
        };
      }

      const content = data.choices[0].message.content;
      console.log('✅ 测试成功，AI回复:', content);

      return {
        success: true,
        message: '✅ API配置测试成功！',
        details: {
          config: apiConfig,
          responseStatus: testResponse.status,
          responseText: content
        }
      };

    } catch (error) {
      console.error('❌ API测试异常:', error);
      
      return {
        success: false,
        message: `❌ API测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        details: {
          error: error instanceof Error ? error.stack : '未知错误'
        }
      };
    }
  }

  // 获取配置建议
  static getConfigSuggestions(): string[] {
    return [
      '🔧 检查API代理地址是否正确（例如：https://api.openai.com/v1/chat/completions）',
      '🔑 确保API密钥有效且未过期',
      '🌐 检查网络连接是否正常',
      '📝 确认API模型名称正确（例如：gpt-3.5-turbo, gpt-4）',
      '💰 检查API账户余额是否充足',
      '⏰ 如果使用代理，确认代理服务是否正常运行',
      '🔒 检查防火墙设置是否阻止了API请求'
    ];
  }

  // 格式化错误信息
  static formatErrorMessage(result: ApiDebugResult): string {
    let message = result.message + '\n\n';
    
    if (result.details?.config) {
      message += '📋 当前配置:\n';
      message += `代理地址: ${result.details.config.proxyUrl || '未设置'}\n`;
      message += `模型: ${result.details.config.model || '未设置'}\n`;
      message += `API密钥: ${result.details.config.apiKey ? '已设置' : '未设置'}\n\n`;
    }

    if (result.details?.responseStatus) {
      message += `📥 响应状态: ${result.details.responseStatus}\n`;
    }

    if (result.details?.responseText) {
      message += `📄 响应内容: ${result.details.responseText}\n\n`;
    }

    message += '💡 配置建议:\n';
    message += this.getConfigSuggestions().join('\n');

    return message;
  }
} 