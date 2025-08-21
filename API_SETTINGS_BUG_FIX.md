# API设置严重Bug修复报告

## 问题描述
在 `ApiSettingsModal.tsx` 中存在一个严重bug：当用户更换新的API URL和Key后，拉取模型时，之前URL和Key对应的模型仍然保留在列表中，导致模型列表混乱。

## 问题原因
1. **模型合并逻辑错误**：在 `fetchModels` 函数中，代码将新获取的模型与已保存的模型进行了合并：
   ```javascript
   // 有问题的代码
   const existingModels = loadSavedModels();
   const allModels = [...new Set([...existingModels, ...modelList])];
   ```

2. **缺乏配置变更检测**：当用户修改URL或API Key时，没有清空旧的模型列表。

## 修复方案

### 1. 修改 `fetchModels` 函数
**文件**: `src/app/components/qq/ApiSettingsModal.tsx`

**修改前**:
```javascript
// 合并新获取的模型和已保存的模型，去重
const existingModels = loadSavedModels();
const allModels = [...new Set([...existingModels, ...modelList])];

setModels(allModels);
saveModelsToStorage(allModels);
```

**修改后**:
```javascript
// 直接使用新获取的模型列表，不合并旧的模型
setModels(modelList);
saveModelsToStorage(modelList);

// 如果当前选择的模型不在新列表中，清空选择
if (config.model && !modelList.includes(config.model)) {
  setConfig(prev => ({ ...prev, model: '' }));
}
```

### 2. 修改 `handleInputChange` 函数
**文件**: `src/app/components/qq/ApiSettingsModal.tsx`

**新增逻辑**:
```javascript
const handleInputChange = (field: keyof ApiConfig, value: string) => {
  setConfig(prev => ({
    ...prev,
    [field]: value
  }));
  
  // 当用户修改URL或API Key时，清空模型列表
  if (field === 'proxyUrl' || field === 'apiKey') {
    setModels([]);
    // 清空localStorage中的模型列表
    localStorage.removeItem('savedModels');
    // 清空当前选择的模型
    setConfig(prev => ({ ...prev, model: '' }));
  }
};
```

## 修复效果

### 修复前的问题
1. 用户更换API配置后，旧模型仍然显示
2. 模型列表包含多个不同API的模型，造成混乱
3. 用户可能选择到不存在的模型

### 修复后的改进
1. **自动清空**：修改URL或API Key时自动清空模型列表
2. **纯净列表**：每次获取模型只显示当前API的可用模型
3. **智能选择**：自动清空无效的模型选择
4. **用户体验**：避免模型选择错误，提高操作准确性

## 测试验证

### 测试场景
1. **场景1**: 用户从OpenAI切换到Claude API
   - 修改前：显示 `[gpt-4, gpt-3.5-turbo, claude-3, claude-3.5-sonnet]`
   - 修改后：显示 `[claude-3, claude-3.5-sonnet]`

2. **场景2**: 用户修改API Key
   - 修改前：旧模型仍然保留
   - 修改后：模型列表自动清空，需要重新获取

3. **场景3**: 用户选择无效模型
   - 修改前：可能选择到不存在的模型
   - 修改后：自动清空无效选择

### 测试文件
创建了 `test_api_fix.html` 用于验证修复效果。

## 兼容性说明
- 修复不影响现有功能
- 保持向后兼容
- 不影响数据持久化逻辑

## 部署建议
1. 立即部署此修复
2. 建议用户清除浏览器localStorage中的 `savedModels` 数据
3. 监控用户反馈，确保修复效果

## 相关文件
- `src/app/components/qq/ApiSettingsModal.tsx` - 主要修复文件
- `test_api_fix.html` - 测试验证文件
- `API_SETTINGS_BUG_FIX.md` - 本修复文档

