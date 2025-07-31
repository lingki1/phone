# 实现计划

- [x] 1. 扩展数据库支持余额和交易记录存储


  - 在dataManager.ts中添加余额存储(BALANCE_STORE)和交易记录存储(TRANSACTION_STORE)
  - 升级数据库版本到4，在onupgradeneeded中创建新的object stores
  - 实现saveBalance、getBalance、addTransaction、getTransactionHistory方法
  - 添加数据库初始化时的默认余额设置(0元)
  - _需求: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. 创建红包数据类型定义


  - 在src/app/types/目录创建money.ts文件
  - 定义RedPacketData、TransactionRecord、BalanceData接口
  - 扩展Message类型以支持红包消息类型
  - 定义AI红包命令的类型接口
  - _需求: 2.1, 2.2, 2.3, 4.1, 4.2_

- [x] 3. 实现发送红包组件


  - 创建src/app/components/qq/money/SendRedPacket.tsx
  - 实现红包发送的模态框UI，包含金额输入、消息输入、余额显示
  - 添加金额验证逻辑（正数、不超过余额、合理范围）
  - 实现发送确认和取消功能
  - 创建对应的SendRedPacket.css样式文件，参考微信红包设计
  - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2_

- [x] 4. 实现接收红包组件


  - 创建src/app/components/qq/money/ReceiveRedPacket.tsx
  - 实现红包接收的UI界面，显示发送者信息和金额
  - 添加红包打开动画效果
  - 实现领取红包的点击处理逻辑
  - 创建对应的ReceiveRedPacket.css样式文件
  - _需求: 3.1, 3.2, 3.3, 3.4, 5.3, 5.4_

- [x] 5. 实现聊天中的红包消息组件


  - 创建src/app/components/qq/money/RedPacketMessage.tsx
  - 实现在聊天界面中显示的红包消息样式
  - 区分已领取和未领取的红包状态显示
  - 添加点击红包打开ReceiveRedPacket组件的逻辑
  - 创建对应的RedPacketMessage.css样式文件
  - _需求: 6.1, 6.2, 6.3, 6.5, 5.5_

- [x] 6. 扩展ChatInterface支持红包功能


  - 在ChatInterface.tsx中导入红包相关组件
  - 在输入区域添加红包发送按钮
  - 修改renderMessageContent方法支持红包消息类型渲染
  - 实现红包发送和接收的事件处理函数
  - 更新AI命令解析逻辑，支持send_red_packet和request_red_packet命令
  - _需求: 6.1, 6.2, 4.1, 4.3, 4.5_

- [x] 7. 更新MePage显示实时余额


  - 修改MePage.tsx从dataManager获取实时余额
  - 实现余额变化时的自动更新机制
  - 添加余额加载状态和错误处理
  - 保持现有localStorage回退机制
  - _需求: 1.3, 1.5_

- [x] 8. 扩展AI系统提示词支持红包命令


  - 修改ChatInterface.tsx中的buildSystemPrompt方法
  - 添加红包功能的使用说明到系统提示词
  - 定义send_red_packet和request_red_packet的JSON命令格式
  - 更新单聊和群聊的系统提示词模板
  - _需求: 7.1, 7.2, 7.3, 7.5_

- [x] 9. 实现AI红包命令处理逻辑

  - 在ChatInterface.tsx的createAiMessage方法中添加红包命令处理
  - 实现send_red_packet命令的解析和红包创建
  - 实现request_red_packet命令的解析和请求处理
  - 添加命令格式验证和错误处理
  - 确保红包操作后立即更新数据库
  - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 7.4_

- [x] 10. 添加红包交易历史记录功能

  - 实现每次红包发送和接收时记录交易
  - 在dataManager中完善交易记录的存储和查询
  - 确保交易记录包含完整的发送者、接收者、金额、时间信息
  - 添加交易状态管理（pending、completed、failed）
  - _需求: 6.4_

- [x] 11. 实现错误处理和用户反馈

  - 添加余额不足时的错误提示
  - 实现数据库操作失败的回退机制
  - 添加红包操作成功的反馈提示
  - 实现AI命令格式错误的处理和提示
  - _需求: 2.5, 4.4, 7.4_

- [x] 12. 集成测试和优化



  - 测试完整的红包发送和接收流程
  - 验证AI红包命令的正确处理
  - 测试数据库事务的一致性
  - 优化红包组件的性能和用户体验
  - 确保与现有聊天功能的兼容性
  - _需求: 6.5_