# 红包货币系统

## 功能概述

这个红包货币系统为聊天应用提供了完整的虚拟货币交互功能，包括：

- 虚拟货币余额管理
- 红包发送和接收
- AI角色红包交互
- 交易历史记录
- 数据持久化存储

## 组件说明

### SendRedPacket.tsx
发送红包的模态框组件，提供：
- 金额输入和验证
- 预设金额快捷选择
- 祝福语输入
- 余额检查
- 发送确认

### ReceiveRedPacket.tsx
接收红包的组件，提供：
- 红包展示界面
- 领取动画效果
- 成功反馈
- 红包状态管理

### RedPacketMessage.tsx
聊天中的红包消息组件，支持：
- 不同类型红包显示（发送/接收/请求）
- 红包状态展示
- 点击交互
- 模态框集成

## 数据库结构

### 余额存储 (BALANCE_STORE)
```typescript
{
  id: 'default',
  balance: number,
  lastUpdated: number
}
```

### 交易记录存储 (TRANSACTION_STORE)
```typescript
{
  id: string,
  type: 'send' | 'receive',
  amount: number,
  chatId: string,
  fromUser: string,
  toUser: string,
  message?: string,
  timestamp: number,
  status: 'pending' | 'completed' | 'failed'
}
```

## AI命令格式

### 发送红包
```json
{
  "type": "send_red_packet",
  "name": "AI角色名",
  "amount": 10.5,
  "message": "恭喜发财！"
}
```

### 请求红包
```json
{
  "type": "request_red_packet",
  "name": "AI角色名",
  "message": "求红包～"
}
```

## 使用方法

1. **发送红包**：点击聊天界面的红包按钮，输入金额和祝福语
2. **接收红包**：点击聊天中的红包消息进行领取
3. **查看余额**：在个人页面查看当前余额
4. **AI交互**：AI角色可以主动发送红包或请求红包

## 安全特性

- 余额验证：发送前检查余额是否充足
- 金额限制：单次红包金额不超过10000元
- 状态管理：防止重复领取红包
- 数据一致性：确保余额和交易记录的一致性

## 错误处理

- 数据库操作失败时的回退机制
- 网络错误的用户友好提示
- 输入验证和格式检查
- 异常状态的恢复处理