# SillyTavern 角色卡片导入功能

## 概述

这个模块提供了从 SillyTavern PNG 角色卡片导入角色到聊天应用的功能。

## 功能特性

- ✅ 支持 PNG 格式的 SillyTavern 角色卡片
- ✅ Base64 解码和 PNG 元数据提取
- ✅ 角色信息预览和验证
- ✅ 拖拽上传支持
- ✅ 完整的错误处理
- ✅ 响应式设计

## 文件结构

```
characterimport/
├── index.ts                    # 模块导出
├── types.ts                    # 类型定义
├── CharacterCardParser.ts      # PNG 解析器
├── CharacterImportModal.tsx    # 主导入模态框
├── CharacterImportModal.css    # 模态框样式
├── CharacterPreview.tsx        # 角色预览组件
├── CharacterPreview.css        # 预览样式
├── encoding-fix.ts             # 编码修复工具
├── encoding-test.js            # 编码修复测试脚本
├── debug.ts                    # 调试工具
├── test.html                   # 测试页面
├── quick-test.js               # 快速测试脚本
└── README.md                   # 说明文档
```

## 使用方法

### 1. 导入组件

```typescript
import { CharacterImportModal } from './characterimport';
```

### 2. 在组件中使用

```typescript
const [showCharacterImport, setShowCharacterImport] = useState(false);

const handleImportCharacter = (character: ChatItem) => {
  // 处理导入的角色
  console.log('导入的角色:', character);
};

<CharacterImportModal
  isVisible={showCharacterImport}
  onClose={() => setShowCharacterImport(false)}
  onImportCharacter={handleImportCharacter}
  apiConfig={apiConfig}
  personalSettings={personalSettings}
/>
```

## 支持的 SillyTavern 格式

### 支持的版本

- **SillyTavern v1**: 传统格式，角色数据直接存储在 JSON 中
- **SillyTavern v2**: 新格式，角色数据包装在 `data` 字段中

### 角色数据结构

#### v1 格式
```typescript
interface SillyTavernCharacter {
  name: string;                    // 角色名称
  description: string;             // 角色描述
  personality: string;             // 角色人设
  scenario: string;                // 场景设定
  first_mes: string;               // 首次消息
  mes_example: string;             // 示例对话
  creator_notes: string;           // 创建者备注
  tags: string[];                  // 标签
  creator: string;                 // 创建者
  character_version: string;       // 版本
  alternate_greetings: string[];   // 替代问候语
  post_history_instructions: string; // 历史指令
  world_scenario: string;          // 世界设定
  character_book: string;          // 角色书
  extensions: Record<string, any>; // 扩展数据
}
```

#### v2 格式
```typescript
interface SillyTavernV2Wrapper {
  spec: 'chara_card_v2';
  spec_version: string;
  data: SillyTavernCharacter;      // 实际的角色数据
}
```

### PNG 元数据格式

SillyTavern 将角色数据存储在 PNG 文件的 `tEXt` 或 `iTXt` 块中，关键字为 `chara`。

## 解析流程

1. **文件验证**: 检查文件类型和大小
2. **Base64 解码**: 将文件转换为 Base64 格式
3. **PNG 元数据提取**: 解析 PNG 文件结构，提取文本块
4. **Base64 解码**: 解码元数据字符串
5. **编码修复**: 修复中文编码问题（如果存在）
6. **JSON 解析**: 解析 SillyTavern 角色数据
7. **格式检测**: 检测 SillyTavern 版本格式
8. **字段映射**: 映射角色字段到标准格式
9. **数据验证**: 验证必要字段的完整性
10. **图像提取**: 提取角色头像数据

## 编码修复

### 支持的编码问题

- **乱码字符**: 修复常见的中文乱码模式
- **Unicode 转义**: 修复 `\u` 转义序列
- **UTF-8 编码**: 自动检测和修复 UTF-8 编码问题

### 修复方法

1. **自动检测**: 检测字符串中的编码问题类型
2. **TextDecoder**: 使用浏览器内置的 TextDecoder API
3. **手动修复**: 针对特定乱码模式进行字符替换
4. **多重尝试**: 依次尝试不同的编码方式

## 错误处理

- 文件类型不支持
- 文件大小超限
- PNG 元数据缺失
- JSON 解析失败
- 角色数据不完整

## 集成到现有系统

### 在 ChatListPage 中集成

1. 在右上角加号菜单中添加"导入角色卡片"选项
2. 点击后打开导入模态框
3. 导入成功后自动创建新的聊天项目

### 数据映射

| SillyTavern 字段 | 项目字段 | 说明 |
|------------------|----------|------|
| name | chat.name | 角色名称 |
| personality | chat.persona | 角色人设 |
| description | chat.description | 角色描述 |
| 图像数据 | chat.avatar | 角色头像 |

## 注意事项

1. **文件大小限制**: 建议不超过 5MB
2. **格式要求**: 仅支持 PNG 格式
3. **数据完整性**: 必须包含角色名称和人设
4. **图像质量**: 建议使用高质量的角色头像

## 未来扩展

- [ ] 批量导入功能
- [ ] 角色卡片导出功能
- [ ] 更多格式支持（JSON、TXT）
- [ ] 角色数据编辑功能
- [ ] 角色库管理 