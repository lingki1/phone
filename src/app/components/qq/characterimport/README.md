# SillyTavern 角色卡片导入功能

这个模块提供了从 SillyTavern 角色卡片（PNG 格式）导入角色的功能。

## 功能特性

- ✅ 支持 PNG 格式的 SillyTavern 角色卡片
- ✅ 自动解析角色信息（名称、描述、人设等）
- ✅ 拖拽上传支持
- ✅ 角色预览功能
- ✅ 自动创建聊天项目
- ✅ 响应式设计

## 使用方法

### 1. 导入角色卡片

1. 在聊天列表页面，点击右上角的 "+" 按钮
2. 选择 "导入角色卡片" 选项
3. 拖拽 PNG 文件到上传区域，或点击选择文件
4. 预览角色信息，确认无误后点击 "确认导入"
5. 角色将自动添加到聊天列表中

### 2. 支持的文件格式

- **PNG 文件**：SillyTavern 导出的角色卡片
- **文件大小**：最大 10MB
- **编码格式**：支持 Base64 编码的角色数据

## 技术实现

### 核心组件

- `CharacterImportModal.tsx` - 主导入模态框
- `CharacterPreview.tsx` - 角色预览组件
- `CharacterCardParser.ts` - PNG 解析器
- `types.ts` - 类型定义

### PNG 解析流程

1. **文件验证**：检查文件类型和大小
2. **数据读取**：使用 FileReader 读取文件内容
3. **PNG 解析**：解析 PNG 文件中的 tEXt 块
4. **Base64 解码**：解码角色数据
5. **数据验证**：验证角色信息的完整性
6. **角色创建**：创建新的聊天项目

### 数据结构

```typescript
interface SillyTavernCharacter {
  name: string;              // 角色名称
  description: string;       // 角色描述
  personality: string;       // 角色人设
  scenario: string;          // 场景设定
  first_mes: string;         // 首条消息
  mes_example: string;       // 对话示例
  creator_notes: string;     // 创建者备注
  tags: string[];           // 标签
  creator: string;          // 创建者
  character_version: string; // 版本
  // ... 其他字段
}
```

## 注意事项

1. **PNG 格式要求**：必须是 SillyTavern 导出的标准格式
2. **数据完整性**：如果无法解析角色数据，将使用文件名作为角色名称
3. **文件大小限制**：单个文件不能超过 10MB
4. **浏览器兼容性**：需要支持 FileReader API 的现代浏览器

## 故障排除

### 常见问题

1. **无法解析角色数据**
   - 确保文件是有效的 SillyTavern 角色卡片
   - 检查文件是否损坏

2. **上传失败**
   - 检查文件大小是否超过限制
   - 确保文件格式为 PNG

3. **预览显示异常**
   - 刷新页面重试
   - 检查浏览器控制台是否有错误信息

## 开发说明

### 添加新功能

1. 在 `types.ts` 中定义新的类型
2. 在 `CharacterCardParser.ts` 中添加解析逻辑
3. 在 `CharacterPreview.tsx` 中添加显示逻辑
4. 更新 `CharacterImportModal.tsx` 中的处理逻辑

### 测试

使用提供的示例文件进行测试：
- `png-to-json-sample.json` - 英文角色卡片示例
- `chinese-png-to-json-sample.json` - 中文角色卡片示例 