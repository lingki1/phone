# 批量生成功能优化文档

## 概述

本次优化解决了API使用频率过高的问题，将原来为每个角色单独发送API请求的方式改为一次性批量生成所有内容，大大减少了API调用次数。

## 问题分析

### 原有问题
- 每次刷新都会根据AI角色数量发送多次API请求
- 如果有100个AI角色，就会发送100次API请求
- 这种方式浪费API配额，效率低下

### 优化目标
- 将所有聊天内容整合到一次API请求中
- 返回的JSON解析后制作成不同人的动态和评论
- 大幅减少API调用次数

## 技术实现

### 1. 新增批量生成接口

在 `aiPostGenerator.ts` 中新增了 `generateBatchContent` 方法：

```typescript
async generateBatchContent(
  characters: ChatItem[], 
  postsCount: number = 3, 
  commentsPerPost: number = 2
): Promise<{ posts: DiscoverPost[]; comments: DiscoverComment[] }>
```

### 2. 批量请求数据结构

```typescript
{
  characters: [
    {
      id: string,
      name: string,
      persona: string,
      avatar: string,
      chatHistory: Message[], // 最近10条聊天记录
      totalMessages: number
    }
  ],
  generationConfig: {
    postsCount: number,
    commentsPerPost: number,
    maxPostLength: number,
    maxCommentLength: number
  },
  context: {
    timestamp: number,
    totalCharacters: number
  }
}
```

### 3. 批量响应格式

```typescript
{
  "posts": [
    {
      "characterId": "角色ID",
      "content": "动态内容",
      "images": [],
      "tags": ["标签1", "标签2"],
      "mood": "😊",
      "location": "位置信息",
      "type": "text"
    }
  ],
  "comments": [
    {
      "characterId": "角色ID",
      "postId": "0", // 对应posts数组的索引
      "content": "评论内容"
    }
  ]
}
```

### 4. 系统提示词优化

新增了专门的批量生成系统提示词 `buildBatchSystemPrompt()`，包含：

- 聊天历史分析指导
- 动态生成要求
- 评论生成要求
- 详细的返回格式说明
- 示例输出

### 5. API调用优化

修改了 `callApi` 方法，添加了 `isBatch` 参数来区分批量生成和单个生成：

```typescript
private async callApi(apiConfig: ApiConfig, requestData: unknown, isBatch: boolean = false)
```

## 使用方式

### 在 DiscoverPage.tsx 中的使用

```typescript
// 使用优化的批量生成功能
if (settings?.autoGeneratePosts) {
  const postCount = Math.floor(Math.random() * 2) + 1;
  const commentCount = settings?.allowAiComments ? Math.floor(Math.random() * 2) + 1 : 0;
  
  const { posts: newPosts, comments: newComments } = await aiPostGenerator.generateBatchContent(
    aiCharacters, 
    postCount, 
    commentCount
  );
}
```

## 性能提升

### API调用次数对比

| 场景 | 原有方式 | 优化后方式 | 提升 |
|------|----------|------------|------|
| 3个动态，每个2条评论 | 9次API调用 | 1次API调用 | 88.9% |
| 5个动态，每个3条评论 | 20次API调用 | 1次API调用 | 95% |
| 10个动态，每个2条评论 | 30次API调用 | 1次API调用 | 96.7% |

### 响应时间对比

- **原有方式**: 需要等待多个API请求依次完成
- **优化后方式**: 只需等待一次API请求，然后并行处理响应数据

## 测试方法

### 1. 运行测试脚本

```powershell
.\test-batch-generation.ps1
```

### 2. 手动测试步骤

1. 打开 http://localhost:3000
2. 导航到动态页面
3. 点击右上角的刷新按钮
4. 检查浏览器控制台的日志
5. 验证是否只发送了一次API请求
6. 确认生成了多个动态和评论

### 3. 预期行为

- 控制台显示 "🚀 开始批量生成内容，优化API使用"
- 只发送一次API请求
- 从单个响应中解析出多个动态和评论
- 聊天历史被包含在API请求中
- 生成的内容更加个性化和上下文相关

## 注意事项

1. **API响应格式**: 必须严格按照指定的JSON格式返回
2. **postId映射**: 评论中的postId使用数字索引，对应posts数组的位置
3. **错误处理**: 如果批量生成失败，会回退到原有的单个生成方式
4. **聊天历史**: 每个角色只包含最近10条聊天记录，避免请求过大

## 未来优化方向

1. **智能角色选择**: 根据活跃度和聊天频率智能选择生成内容的角色
2. **内容质量优化**: 进一步优化系统提示词，提高生成内容的质量
3. **缓存机制**: 对常用的聊天历史进行缓存，减少重复计算
4. **异步处理**: 将内容保存操作改为异步，提高响应速度

## 总结

通过这次优化，我们成功地将API调用次数从O(n)降低到O(1)，大大提高了系统的效率和用户体验。同时保持了生成内容的质量和个性化程度，是一个成功的性能优化案例。 