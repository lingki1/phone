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

- [x] 13. 优化发送红包即时关闭功能



  - 修改SendRedPacket组件的handleSend方法，发送后立即关闭界面
  - 移除等待AI回复的逻辑，改为异步发送
  - 确保发送失败时仍能正常关闭界面
  - 优化发送状态的用户反馈机制
  - _需求: 8.1, 8.2, 8.3, 8.4_

- [x] 14. 实现用户发送红包的状态显示



  - 扩展RedPacketData接口，添加status字段支持pending/accepted/rejected状态
  - 修改RedPacketMessage组件，为用户发送的红包添加状态显示
  - 实现AI接收/拒绝红包时更新用户发送红包的状态
  - 添加状态更新的数据库持久化逻辑
  - 确保状态显示样式与AI接收红包保持一致
  - _需求: 9.1, 9.2, 9.3, 9.4, 9.5_



- [x] 15. 优化SendRedPacket组件移动端适配


  - 调整SendRedPacket组件的CSS样式，减少在小屏幕上的高度占用
  - 优化各个区域的内边距和间距，适应移动设备
  - 添加针对低高度屏幕的特殊样式处理
  - 确保所有交互元素在移动设备上的可用性
  - 测试在不同屏幕尺寸下的显示效果



  - _需求: 10.1, 10.2, 10.3, 10.4, 10.5_


- [x] 16. 简化红包消息聊天显示样式



  - 修改RedPacketMessage.css，移除多余的背景装饰和包装样式
  - 简化红包消息容器的样式，只保留红包本身的视觉效果
  - 确保不同类型红包消息的样式一致性
  - 优化红包消息与普通消息的视觉层次
  - 测试样式更改对现有功能的影响
  - _需求: 11.1, 11.2, 11.3, 11.4, 11.5_
- [
x] 17. 修复红包消息黑色背景问题

  - 在ChatInterface.css中添加红包消息特殊样式规则
  - 移除红包消息的message-bubble背景和边框
  - 使用:has选择器和兼容性备选方案
  - 确保红包消息只显示红包本身内容，无额外包装
  - 测试在不同浏览器中的兼容性

- [x] 18. 修复AI拒绝红包状态更新问题

  - 在handleAiAcceptRedPacket和handleAiDeclineRedPacket中添加红包ID清理逻辑
  - 移除红包ID中可能的额外字符（如AI生成的多余字符）
  - 添加调试日志以便排查红包ID匹配问题
  - 更新红包状态匹配逻辑，支持原始ID和清理后ID的双重匹配
  - 确保AI接收/拒绝红包时状态能正确更新

- [x] 19. 改进红包ID匹配逻辑

  - 当AI提供的红包ID无法精确匹配时，自动查找最近的未处理红包
  - 按时间倒序排列用户发送的待处理红包，选择最新的一个
  - 添加详细的调试日志，显示匹配过程和可用的红包ID
  - 使用实际找到的红包ID进行状态更新，而不是AI提供的错误ID
  - 提高AI红包处理的容错性和可靠性- [
x] 20. 修复AI红包余额重复增加问题

  - 修复AI发送红包时立即增加用户余额的错误逻辑
  - 改为只在用户点击领取红包时才增加余额，避免重复增加
  - 移除send_red_packet命令中的余额操作和交易记录创建
  - 确保handleClaimRedPacket函数正确处理AI红包的领取
  - 保持交易记录的正确性和一致性

- [x] 21. 添加红包状态显示调试信息

  - 在RedPacketMessage组件中添加状态显示的调试日志
  - 帮助排查前端界面红包状态更新不显示的问题
  - 记录红包ID和状态信息，便于问题定位
  - 确保状态更新能正确传播到前端组件- [x
] 22. 移除无限spam调试信息

  - 移除RedPacketMessage组件中的console.log调试信息
  - 避免前端控制台被无限spam的日志信息
  - 保持代码的清洁性和性能

- [x] 23. 修复AI接收红包状态不更新问题

  - 修复handleAiAcceptRedPacket中错误设置isClaimed的逻辑
  - AI接收用户红包时不应该设置isClaimed=true
  - isClaimed字段只用于用户领取AI红包的场景
  - 添加微小的timestamp变化来确保React检测到状态更新
  - 确保红包状态能正确显示在前端界面-
 [x] 24. 修复红包状态匹配逻辑错误

  - 移除handleAiAcceptRedPacket和handleAiDeclineRedPacket中错误的isClaimed过滤条件
  - 用户发送给AI的红包不应该使用isClaimed字段进行过滤
  - 只使用status字段来判断红包是否已被处理
  - 添加详细的调试日志来跟踪状态更新过程
  - 确保备选匹配逻辑能找到正确的待处理红包

- [x] 25. 增强红包状态更新调试

  - 在状态更新时添加详细的调试日志
  - 记录实际更新的红包ID和新状态
  - 在RedPacketMessage组件中只在状态变化时输出调试信息
  - 帮助排查状态更新是否正确传播到前端组件