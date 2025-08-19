import { PromptInjector, PromptContext, PresetConfig } from '../types';

export class PresetInjector implements PromptInjector {
  priority = 5; // 预设注入优先级很高，在基础模板之前

  async inject(context: PromptContext): Promise<string> {
    const { currentPreset, isStoryMode } = context;
    
    if (!currentPreset) {
      return '';
    }

    // 构建预设相关的提示词
    const presetContent = this.buildPresetContent(currentPreset, isStoryMode);
    
    console.log(`PresetInjector: 成功注入预设 "${currentPreset.name}"`);
    
    return presetContent;
  }

  // 构建预设内容
  private buildPresetContent(preset: PresetConfig, isStoryMode?: boolean): string {
    let content = `\n\n# 预设配置: ${preset.name}`;
    
    if (preset.description) {
      content += `\n${preset.description}`;
    }

    // 添加预设特定的行为指导
    if (preset.temperature !== undefined) {
      const creativity = this.getCreativityDescription(preset.temperature);
      const settingTitle = isStoryMode ? '## 故事创作设置' : '## 创造性设置';
      const creativityLabel = isStoryMode ? '故事创意水平' : '创造性水平';
      const lengthLabel = isStoryMode ? '最大故事长度' : '最大回复长度';
      const diversityLabel = isStoryMode ? '故事多样性' : '回复多样性';
      
      content += `\n\n${settingTitle}
- **${creativityLabel}**: ${creativity} (temperature: ${preset.temperature})
- **${lengthLabel}**: ${preset.maxTokens} 个token
- **${diversityLabel}**: ${this.getDiversityDescription(preset.topP)}`;
    }

    // 添加预设特定的规则
    if (preset.responseFormat === 'json_object') {
      const formatTitle = isStoryMode ? '## 故事输出格式要求' : '## 输出格式要求';
      const formatDesc = isStoryMode ? '故事内容必须使用严格的JSON对象格式' : '所有回复必须使用严格的JSON对象格式';
      
      content += `\n\n${formatTitle}
- **严格JSON格式**: ${formatDesc}
- **结构化输出**: 确保输出符合预定义的结构`;
    }

    if (preset.stopSequences && preset.stopSequences.length > 0) {
      content += `\n\n## 停止序列
- **停止词**: ${preset.stopSequences.join(', ')}
- **注意**: 遇到这些词时请停止生成`;
    }

    return content;
  }

  // 获取创造性描述
  private getCreativityDescription(temperature: number): string {
    if (temperature <= 0.3) return '保守稳定';
    if (temperature <= 0.6) return '平衡适中';
    if (temperature <= 0.9) return '富有创意';
    return '高度随机';
  }

  // 获取多样性描述
  private getDiversityDescription(topP: number): string {
    if (topP <= 0.3) return '高度聚焦';
    if (topP <= 0.6) return '适度多样';
    if (topP <= 0.9) return '较为多样';
    return '高度多样';
  }

  // 获取API参数（供外部调用）
  getApiParams(preset: PresetConfig): Record<string, unknown> {
    const params: Record<string, unknown> = {
      temperature: preset.temperature || 0.8,
      max_tokens: preset.maxTokens || 2000,
      top_p: preset.topP || 0.8,
      frequency_penalty: preset.frequencyPenalty || 0.0,
      presence_penalty: preset.presencePenalty || 0.0
    };

    if (preset.topK !== undefined) {
      params.top_k = preset.topK;
    }

    if (preset.stopSequences && preset.stopSequences.length > 0) {
      params.stop = preset.stopSequences;
    }

    if (preset.logitBias && Object.keys(preset.logitBias).length > 0) {
      params.logit_bias = preset.logitBias;
    }

    if (preset.responseFormat) {
      params.response_format = { type: preset.responseFormat };
    }

    if (preset.seed !== undefined) {
      params.seed = preset.seed;
    }

    if (preset.user) {
      params.user = preset.user;
    }

    return params;
  }
}
