// 货币系统相关类型定义

// 余额数据类型
export interface BalanceData {
  id: 'default';
  balance: number;
  lastUpdated: number;
}

// 红包数据类型
export interface RedPacketData {
  id: string;
  amount: number;
  message?: string;
  senderName: string;
  senderAvatarId?: string; // 头像ID引用（替代senderAvatar）
  recipientName: string;
  chatId: string;
  timestamp: number;
  isClaimed: boolean;
  claimedAt?: number;
  status?: 'pending' | 'accepted' | 'rejected';
  statusUpdatedAt?: number;
}

// 交易记录类型
export interface TransactionRecord {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  chatId: string;
  fromUser: string;
  toUser: string;
  message?: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

// AI红包命令类型
export interface AiRedPacketCommand {
  type: 'send_red_packet';
  name: string;
  amount: number;
  message?: string;
}

// AI红包请求命令类型
export interface AiRedPacketRequestCommand {
  type: 'request_red_packet';
  name: string;
  message?: string;
}

// 红包消息扩展类型
export interface RedPacketMessageData {
  id: string;
  amount: number;
  message?: string;
  senderName: string;
  senderAvatarId?: string; // 头像ID引用（替代senderAvatar）
  recipientName: string;
  isClaimed: boolean;
  claimedAt?: number;
  redPacketType: 'send' | 'receive' | 'request';
}

// 发送红包组件属性类型
export interface SendRedPacketProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (amount: number, message: string) => Promise<void>;
  currentBalance: number;
  recipientName: string;
}

// 接收红包组件属性类型
export interface ReceiveRedPacketProps {
  redPacket: RedPacketData;
  chat: import('../types/chat').ChatItem; // 添加chat参数以访问avatarMap
  onClaim: (redPacketId: string) => Promise<void>;
  isClaimed: boolean;
}

// 红包消息组件属性类型
export interface RedPacketMessageProps {
  message: RedPacketMessageData;
  onClaim?: (redPacketId: string) => Promise<void>;
  onSend?: () => void;
}

// 货币操作结果类型
export interface MoneyOperationResult {
  success: boolean;
  message: string;
  newBalance?: number;
  transactionId?: string;
}

// 余额变化事件类型
export interface BalanceChangeEvent {
  oldBalance: number;
  newBalance: number;
  change: number;
  reason: 'red_packet_send' | 'red_packet_receive' | 'system_adjustment';
  timestamp: number;
}