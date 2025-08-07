# 预设模板 Max Tokens 更新总结

## 概述

已将预设系统中的所有默认预设模板的 `maxTokens` 值统一更新为 **8000**，以提供更长的AI回复能力。

## 修改内容

### 1. 默认预设模板更新

**文件**: `src/app/utils/presetManager.ts`

更新了 `DEFAULT_PRESET_TEMPLATES` 中所有预设模板的 `maxTokens` 值：

#### 修改前：
- **创意模式**: 2000 tokens
- **平衡模式**: 1500 tokens  
- **精确模式**: 1000 tokens
- **简洁模式**: 500 tokens
- **详细模式**: 3000 tokens

#### 修改后：
- **创意模式**: 8000 tokens
- **平衡模式**: 8000 tokens
- **精确模式**: 8000 tokens
- **简洁模式**: 8000 tokens
- **详细模式**: 8000 tokens

### 2. 自定义预设创建默认值更新

**文件**: `src/app/components/qq/preset/CreatePresetModal.tsx`

更新了自定义预设创建时的默认 `maxTokens` 值：

#### 修改前：
```typescript
maxTokens: 1500,
```

#### 修改后：
```typescript
maxTokens: 8000,
```

### 3. 宇宙图书馆预设更新

**文件**: `src/app/components/qq/preset/宇宙图书馆1.154.json`

更新了宇宙图书馆预设的 `openai_max_tokens` 配置：

#### 修改前：
```json
"openai_max_tokens": 32000,
```

#### 修改后：
```json
"openai_max_tokens": 8000,
```

## 影响范围

### 1. 新创建的预设
- 所有从模板创建的新预设都将使用 8000 tokens 作为默认值
- 自定义创建的预设也将使用 8000 tokens 作为默认值

### 2. 现有预设
- 已存在的预设配置不会自动更新
- 用户需要手动编辑现有预设来应用新的 tokens 限制

### 3. 系统预设
- 宇宙图书馆预设将使用新的 8000 tokens 限制
- 其他导入的预设文件需要手动更新

## 技术细节

### 1. 预设模板结构
```typescript
export const DEFAULT_PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'creative',
    name: '创意模式',
    description: '高创造性，适合创意写作和头脑风暴',
    category: 'creative',
    config: {
      temperature: 0.9,
      maxTokens: 8000,  // 已更新
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      isDefault: false
    }
  },
  // ... 其他预设
];
```

### 2. 验证范围
- `maxTokens` 的有效范围：0-63000
- 8000 tokens 在合理范围内，不会影响系统性能
- 符合大多数AI模型的最大输出限制

### 3. 用户体验
- 用户可以获得更长的AI回复
- 适合需要详细回答的场景
- 保持预设的其他参数不变，只调整长度限制

## 建议

### 1. 用户操作建议
- 检查现有预设的 `maxTokens` 设置
- 根据需要调整到合适的值
- 考虑不同场景下的最佳 tokens 设置

### 2. 性能考虑
- 8000 tokens 会增加API调用成本
- 建议根据实际需求调整
- 可以创建不同长度的预设模板

### 3. 后续优化
- 可以考虑添加预设模板的版本管理
- 提供预设参数的推荐值
- 增加预设使用统计和分析

## 总结

通过这次更新，所有默认预设模板现在都使用 8000 tokens 作为最大输出长度，为用户提供了更灵活的AI对话体验。这个设置既保证了回复的完整性，又避免了过长的输出影响性能。 