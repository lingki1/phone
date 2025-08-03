# 聊天背景功能问题诊断指南

## 🚨 问题：上传图片后聊天背景没有更换

### 🔍 诊断步骤

#### 1. 检查浏览器控制台
打开浏览器开发者工具 (F12)，查看 Console 标签页是否有错误信息：
```javascript
// 在控制台运行以下命令检查背景状态
window.debugChatBackground?.runAllChecks()
```

#### 2. 检查数据库
```javascript
// 检查数据库中的背景数据
const db = await indexedDB.open('ChatAppDB', 8);
db.onsuccess = function(event) {
  const database = event.target.result;
  const transaction = database.transaction(['chatBackgrounds'], 'readonly');
  const store = transaction.objectStore('chatBackgrounds');
  const request = store.getAll();
  request.onsuccess = function() {
    console.log('背景数据:', request.result);
  };
};
```

#### 3. 检查localStorage
```javascript
// 检查localStorage中的备份数据
const backgrounds = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('chatBackground_')) {
    backgrounds[key] = localStorage.getItem(key);
  }
}
console.log('localStorage背景:', backgrounds);
```

#### 4. 检查组件状态
在聊天界面中，查看左上角的调试信息（开发环境显示）：
- 背景状态：已设置/未设置
- 背景长度：显示base64字符串长度

### 🛠️ 常见问题及解决方案

#### 问题1：数据库版本不匹配
**症状**: 控制台显示数据库错误
**解决**: 
```javascript
// 删除旧数据库，重新创建
indexedDB.deleteDatabase('ChatAppDB');
// 刷新页面
```

#### 问题2：图片文件过大
**症状**: 上传失败或处理缓慢
**解决**: 
- 压缩图片到5MB以下
- 使用在线图片压缩工具

#### 问题3：base64字符串损坏
**症状**: 背景显示为空白或错误
**解决**: 
```javascript
// 检查base64格式
const background = await dataManager.getChatBackground('your-chat-id');
console.log('背景格式:', background?.substring(0, 50));
// 应该以 "data:image/" 开头
```

#### 问题4：CSS样式冲突
**症状**: 背景图片存在但不显示
**解决**: 
```css
/* 检查z-index层级 */
.chat-background-image {
  z-index: -1 !important;
  position: absolute !important;
}
```

### 🔧 手动修复方法

#### 方法1：清除并重新设置
```javascript
// 清除当前背景
await dataManager.saveChatBackground('your-chat-id', '');
localStorage.removeItem('chatBackground_your-chat-id');

// 重新上传图片
```

#### 方法2：强制刷新组件
```javascript
// 触发背景更新事件
const event = new CustomEvent('backgroundUpdated', { 
  detail: { chatId: 'your-chat-id', background: 'your-base64-string' } 
});
window.dispatchEvent(event);
```

#### 方法3：重置数据库
```javascript
// 完全重置数据库（谨慎使用）
indexedDB.deleteDatabase('ChatAppDB');
location.reload();
```

### 📋 测试清单

- [ ] 数据库连接正常
- [ ] 图片上传成功
- [ ] base64转换正确
- [ ] 数据保存到数据库
- [ ] localStorage备份正常
- [ ] 组件状态更新
- [ ] CSS样式正确
- [ ] 背景图片显示

### 🆘 获取帮助

如果以上方法都无法解决问题，请提供以下信息：

1. **浏览器信息**: Chrome/Firefox/Safari 版本
2. **错误信息**: 控制台完整错误日志
3. **操作步骤**: 详细的操作过程
4. **图片信息**: 图片格式、大小
5. **网络环境**: 是否有代理或防火墙

### 📞 联系支持

创建issue时请包含：
- 问题描述
- 复现步骤
- 错误截图
- 环境信息
- 调试日志 