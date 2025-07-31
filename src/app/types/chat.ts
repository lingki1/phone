

// 基础消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  senderName?: string; // 群聊中发送者的名称
  senderAvatar?: string; // 群聊中发送者的头像
  type?: 'text' | 'image' | 'voice' | 'sticker' | 'poll' | 'red_packet' | 'transfer' | 'waimai_request' | 'ai_image' | 'voice_message' | 'red_packet_send' | 'red_packet_receive' | 'red_packet_request' | 'ai_red_packet_response';
  quote?: QuoteMessage; // 引用回复
  isHidden?: boolean; // 是否对用户隐藏（系统消息）
  meaning?: string; // 表情含义
  url?: string; // 图片或表情URL
  redPacketData?: {
    id: string;
    amount: number;
    message?: string;
    senderName: string;
    recipientName: string;
    isClaimed: boolean;
    claimedAt?: number;
    status?: 'pending' | 'accepted' | 'rejected';
    statusUpdatedAt?: number;
  }; // 红包数据
}

// 引用消息类型
export interface QuoteMessage {
  timestamp: number;
  senderName: string;
  content: string;
}

// 群成员类型
export interface GroupMember {
  id: string;
  originalName: string; // 角色的原始名称
  groupNickname: string; // 在群里的昵称
  avatar: string;
  persona: string; // 角色人设
  avatarFrame?: string; // 头像框
  singleChatId?: string; // 对应的单聊ID，用于获取单聊记忆
  singleChatMemory?: Message[]; // 单聊记忆缓存
}

// 聊天项目类型
export interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isGroup: boolean;
  unreadCount?: number;
  messages: Message[];
  persona: string;
  
  // 群聊特有属性
  members?: GroupMember[];
  groupAvatar?: string;
  groupId?: number; // 分组ID
  notice?: string; // 群公告
  
  // 聊天设置
  settings: ChatSettings;
  
  // 单聊特有属性
  relationship?: {
    status: 'friend' | 'blocked_by_user' | 'blocked_by_ai' | 'pending_ai_approval';
    blockedTimestamp?: number;
    applicationReason?: string;
  };
  
  status?: {
    text: string;
    lastUpdate: number;
    isBusy: boolean;
  };
}

// 聊天设置类型
export interface ChatSettings {
  aiPersona: string;
  myPersona: string;
  myNickname?: string; // 群聊中的昵称
  maxMemory: number;
  aiAvatar: string;
  myAvatar: string;
  groupAvatar?: string;
  background: string;
  theme: string;
  fontSize: number;
  customCss: string;
  linkedWorldBookIds: string[];
  aiAvatarLibrary: AvatarLibraryItem[];
  aiAvatarFrame: string;
  myAvatarFrame: string;
  groupRules?: string; // 群规内容
  // API配置（可选，用于单聊）
  proxyUrl?: string;
  apiKey?: string;
  model?: string;
}

// 头像库项目类型
export interface AvatarLibraryItem {
  name: string;
  url: string;
}

// API配置类型
export interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
}

// 投票选项类型
export interface PollOption {
  text: string;
  votes: string[]; // 投票者列表
}

// 投票消息类型
export interface PollMessage extends Message {
  type: 'poll';
  question: string;
  options: string[];
  votes: { [option: string]: string[] };
  isClosed: boolean;
}

// 红包消息类型
export interface RedPacketMessage extends Message {
  type: 'red_packet';
  packetType: 'lucky' | 'direct';
  totalAmount: number;
  count: number;
  greeting: string;
  receiverName?: string; // 专属红包的接收者
  claimedBy: { [name: string]: number };
  isFullyClaimed: boolean;
}

// 转账消息类型
export interface TransferMessage extends Message {
  type: 'transfer';
  amount: number;
  note: string;
  receiverName: string;
  status?: 'pending' | 'accepted' | 'declined';
  isRefund?: boolean;
}

// 外卖请求消息类型
export interface WaimaiRequestMessage extends Message {
  type: 'waimai_request';
  productInfo: string;
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  countdownEndTime: number;
  paidBy?: string;
}

// 全局设置类型
export interface GlobalSettings {
  wallpaper?: string;
  userAvatar?: string;
  chatListBackground?: string;
  chatListBackgroundOpacity?: number;
  applyChatListBgToChat?: boolean;
  fontUrl?: string;
  appIcons?: { [key: string]: string };
  enableBackgroundActivity?: boolean;
  backgroundActivityInterval?: number;
  blockCooldownHours?: number;
}

// 世界书类型
export interface WorldBook {
  id: string;
  name: string;
  content: string;
}

// 人设预设类型
export interface PersonaPreset {
  id: string;
  avatar: string;
  persona: string;
}

// 表情包类型
export interface Sticker {
  id: string;
  url: string;
  name: string;
}

// 回忆录类型
export interface Memory {
  id?: number;
  chatId: string;
  authorName: string;
  description: string;
  timestamp: number;
  type: 'ai_generated' | 'countdown';
  targetDate?: number; // 倒计时目标时间
}

// 动态帖子类型
export interface QzonePost {
  id?: number;
  type: 'shuoshuo' | 'text_image';
  content: string;
  publicText?: string;
  hiddenContent?: string;
  timestamp: number;
  authorId: string;
  authorGroupId?: number;
  visibleGroupIds?: number[];
  likes?: string[];
  comments?: QzoneComment[];
}

// 动态评论类型
export interface QzoneComment {
  commenterName: string;
  text: string;
  timestamp: number;
}

// 动态分组类型
export interface QzoneGroup {
  id?: number;
  name: string;
}

// 通话记录类型
export interface CallRecord {
  id?: number;
  chatId: string;
  participants: GroupMember[];
  duration: number; // 通话时长（秒）
  timestamp: number;
  transcript: { role: 'user' | 'assistant'; content: string }[];
  customName?: string; // 自定义通话名称
}

// 音乐状态类型
export interface MusicState {
  isActive: boolean;
  activeChatId: string | null;
  playlist: MusicTrack[];
  currentIndex: number;
  isPlaying: boolean;
  totalElapsedTime: number;
  playMode: 'order' | 'random' | 'single';
  timerId: number | null;
}

// 音乐曲目类型
export interface MusicTrack {
  name: string;
  artist: string;
  src: string | Blob;
  isLocal: boolean;
}

// 视频通话状态类型
export interface VideoCallState {
  isActive: boolean;
  isAwaitingResponse: boolean;
  isGroupCall: boolean;
  activeChatId: string | null;
  callRequester: string;
  participants: GroupMember[];
  initiator: 'user' | 'ai';
} 