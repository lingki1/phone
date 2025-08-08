# CCV3 角色卡解析修复

## 问题描述

在解析某些 PNG 角色卡时，系统显示错误：
```
CharacterCardParser.ts:265 角色数据中未找到名称字段，可用字段: ['spec', 'spec_version', 'data']
```

## 问题原因

某些角色卡使用了 ImageMagick 格式的元数据存储，其中角色数据存储在 `ccv3` 字段中，该字段位于：
```
jsonData[0].image.properties.ccv3
```

而原有的解析器只查找标准的 PNG `tEXt` 和 `iTXt` 块，没有处理这种特殊的 JSON 格式。

## 解决方案

### 1. 在 `extractPNGMetadata` 方法中添加 ImageMagick 格式支持

在 `CharacterCardParser.ts` 的 `extractPNGMetadata` 方法中添加了对 ImageMagick 格式的支持：

```typescript
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
```

### 2. 在 `parseSillyTavernData` 方法中添加 CCV3 格式支持

在 `parseSillyTavernData` 方法中添加了对 CCV3 格式的处理：

```typescript
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
```

## 测试结果

修复后成功解析了包含 ImageMagick 格式的角色卡：
- 角色名称: Lea | Lovely Puppet Librarian
- 描述长度: 7549 字符
- 标签数量: 23 个
- 创建者: mallie
- 版本: 1.0

## 兼容性

此修复保持了向后兼容性，仍然支持：
1. 标准的 PNG `tEXt` 和 `iTXt` 块
2. 直接的 JSON 格式
3. 新增的 ImageMagick 格式

## 文件修改

- `src/app/components/qq/characterimport/CharacterCardParser.ts` - 添加 ImageMagick 格式支持和 CCV3 格式处理
- `src/app/components/qq/characterimport/test.html` - 更新 HTML 测试页面以支持 ImageMagick 格式和 CCV3 格式
