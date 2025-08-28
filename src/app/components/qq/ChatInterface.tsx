'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Message, ChatItem, GroupMember, QuoteMessage } from '../../types/chat';
import { dataManager } from '../../utils/dataManager';
import GroupMemberManager from './GroupMemberManager';
import MemoryManager from './memory/MemoryManager';
import SingleChatMemoryManager from './memory/SingleChatMemoryManager';
import SendRedPacket from './money/SendRedPacket';
import RedPacketMessage from './money/RedPacketMessage';
import AiRedPacketResponse from './money/AiRedPacketResponse';
import { ChatStatusManager, ChatStatusDisplay, ChatStatus } from './chatstatus';
import { ChatBackgroundManager, ChatBackgroundModal } from './chatbackground';
import { useAiPendingState } from '../async';
import { getPromptManager, PromptContext } from '../systemprompt';
import { WorldBookAssociationSwitchModal } from './worldbook';
import { MessagePaginationManager, MessageItem, GiftHistory } from './chat';
import { StoryModeToggle, StoryModeDisplay } from './storymode';
import { BatchDeleteSelector } from './messageactions';
import './ChatInterface.css';

interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
}

interface PresetConfig {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK?: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences?: string[];
  logitBias?: Record<string, number>;
  responseFormat?: 'text' | 'json_object';
  seed?: number;
  user?: string;
}

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface ChatInterfaceProps {
  chat: ChatItem;
  apiConfig: ApiConfig;
  onBack: () => void;
  onUpdateChat: (chat: ChatItem) => void;
  availableContacts: ChatItem[];
  allChats?: ChatItem[];
  personalSettings?: PersonalSettings;
  currentPreset?: PresetConfig;
}

export default function ChatInterface({ 
  chat, 
  apiConfig, 
  onBack, 
  onUpdateChat,
  availableContacts,
  allChats,
  personalSettings,
  currentPreset
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAiUser, setCurrentAiUser] = useState<{name: string, avatar: string} | null>(null);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [showSingleChatMemoryManager, setShowSingleChatMemoryManager] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<QuoteMessage | undefined>(undefined);
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const [editingMessage, setEditingMessage] = useState<{id: string, content: string} | null>(null);
  const [dbPersonalSettings, setDbPersonalSettings] = useState<PersonalSettings | null>(null);
  const [showSendRedPacket, setShowSendRedPacket] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [chatBackground, setChatBackground] = useState<string>('');

  const [chatOpacity, setChatOpacity] = useState<number>(80);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showWorldBookAssociationSwitch, setShowWorldBookAssociationSwitch] = useState(false);
  const [showGiftHistory, setShowGiftHistory] = useState(false);
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  
  // 剧情模式相关状态
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [storyModeInput, setStoryModeInput] = useState('');
  const [storyModeMessages, setStoryModeMessages] = useState<Message[]>([]);
  // 回复触发方式：false=按键生成，true=发送键生成
  const [autoGenerateOnSend, setAutoGenerateOnSend] = useState<boolean>(false);
  
  // 分页相关状态
  const [isPaginationEnabled] = useState(true);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  
  // 跟踪是否有新的用户消息待AI回复
  const [hasNewUserMessage, setHasNewUserMessage] = useState(() => {
    // 初始化时检查最后一条消息是否为用户消息
    if (chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      return lastMessage.role === 'user';
    }
    return false;
  });
  
  // 使用异步AI状态管理
  const { isPending, startAiTask, endAiTask } = useAiPendingState(chat.id);
  
  // 使用useRef来避免循环依赖
  const triggerAiResponseRef = useRef<((updatedChat: ChatItem, isStoryModeCall?: boolean) => Promise<void>) | null>(null);
  const createAiMessageRef = useRef<((msgData: Record<string, unknown>, chat: ChatItem, timestamp: number) => Promise<Message | null>) | null>(null);
  
  // 聊天状态相关状态
  const [chatStatus, setChatStatus] = useState<ChatStatus>({
    isOnline: true,
    mood: '心情愉快',
    location: '在家中',
    outfit: '穿着休闲装',
    lastUpdate: Date.now()
  });

  // 设置当前活跃的聊天页面，用于通知抑制
  useEffect(() => {
    // 设置全局变量，告诉通知系统当前在哪个聊天页面
    window.currentActiveChatId = chat.id;
    
    return () => {
      // 清除当前活跃聊天ID
      window.currentActiveChatId = null;
      // 清理本地状态，但保留AI pending状态到localStorage
      setIsLoading(false);
      setCurrentAiUser(null);
      // 注意：不调用endAiTask()，保持AI pending状态持久化
      
      // 清理防抖定时器
      if (heightAdjustTimerRef.current) {
        clearTimeout(heightAdjustTimerRef.current);
      }
      if (mentionCheckTimerRef.current) {
        clearTimeout(mentionCheckTimerRef.current);
      }
      if (scrollUpdateTimerRef.current) {
        clearTimeout(scrollUpdateTimerRef.current);
      }
    };
  }, [chat.id]);

  // 加载与持久化“发送即生成”设置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`autoGenerateOnSend_${chat.id}`);
      setAutoGenerateOnSend(saved === 'true');
    } catch {}
  }, [chat.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`autoGenerateOnSend_${chat.id}`, autoGenerateOnSend ? 'true' : 'false');
    } catch {}
  }, [chat.id, autoGenerateOnSend]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // 支持从聊天列表跳转定位到指定消息
  useEffect(() => {
    const handler = (e: Event) => {
      const { chatId, messageId } = (e as CustomEvent).detail || {};
      if (!messageId || chatId !== chat.id) return;
      // 优先在已展示消息中查找
      const el = document.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
      if (el && messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: (el as HTMLElement).offsetTop - 80,
          behavior: 'smooth'
        });
      } else {
        // TODO: 如需支持分页自动加载直到找到，可在此扩展
      }
    };
    window.addEventListener('scrollToMessage', handler as EventListener);
    return () => window.removeEventListener('scrollToMessage', handler as EventListener);
  }, [chat.id]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // 自动调整输入框高度（添加防抖优化）
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 使用transform来避免重排，提高性能
    const currentHeight = textarea.style.height;
    textarea.style.height = 'auto';
    
    // 计算新高度，最小高度为一行，最大高度为5行
    const minHeight = 40; // 一行的高度
    const maxHeight = 120; // 5行的高度
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    
    // 只有当高度真正改变时才更新，避免不必要的DOM操作
    if (currentHeight !== `${newHeight}px`) {
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // 检测用户是否在查看历史消息（添加防抖优化）
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px容差
    
    // 使用防抖避免频繁状态更新
    setShouldAutoScroll(prev => {
      if (prev !== isAtBottom) {
        return isAtBottom;
      }
      return prev;
    });
  }, []);

  // 自动滚动到最新消息
  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // 强制滚动到底部（用于新消息到达时）
  const forceScrollToBottom = useCallback(() => {
    scrollToBottom(false);
    setShouldAutoScroll(true);
  }, []);

  // 当消息列表更新时，根据用户行为决定是否自动滚动
  useEffect(() => {
    console.log('Auto scroll check:', {
      shouldAutoScroll,
      messagesLength: chat.messages.length,
      isLoadingMoreMessages,
      shouldScroll: shouldAutoScroll && chat.messages.length > 0 && !isLoadingMoreMessages
    });
    
    if (shouldAutoScroll && chat.messages.length > 0 && !isLoadingMoreMessages) {
      // 新消息到达时使用平滑滚动
      console.log('Triggering auto scroll to bottom');
      scrollToBottom(true);
    }
  }, [chat.messages.length, shouldAutoScroll, isLoadingMoreMessages]);



  // 当用户发送消息时，强制滚动到底部
  useEffect(() => {
    if (chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage.role === 'user') {
        forceScrollToBottom();
      }
    }
  }, [chat.messages, forceScrollToBottom]);

  // 初始化剧情模式消息状态
  useEffect(() => {
    const loadStoryModeMessages = async () => {
      try {
        const messages = await dataManager.getStoryModeMessages(chat.id);
        setStoryModeMessages(messages);
        console.log('Story mode messages loaded:', messages.length, 'messages');
      } catch (error) {
        console.error('Failed to load story mode messages:', error);
        setStoryModeMessages([]);
      }
    };

    loadStoryModeMessages();
  }, [chat.id]);

  // 剧情模式开场白：进入剧情模式且首次对话时自动发送 firstMsg
  useEffect(() => {
    const trySendFirstMsg = async () => {
      if (!isStoryMode) return;
      const opening = chat.settings.firstMsg?.trim();
      if (!opening) return;
      if (storyModeMessages.length > 0) return;

      // 获取用户昵称并替换开场白中的 {{user}}
      const userNickname = dbPersonalSettings?.userNickname || personalSettings?.userNickname || '我';
      const processedOpening = opening.replace(/\{\{user\}\}/g, userNickname);

      const aiMessage: Message = {
        id: `${chat.id}_story_ai_${Date.now()}`,
        role: 'assistant',
        content: processedOpening,
        timestamp: Date.now(),
        type: 'text',
        senderName: chat.name,
        isRead: true
      };

      // 更新内存与持久化
      setStoryModeMessages([aiMessage]);
      try {
        await dataManager.addStoryModeMessage(chat.id, aiMessage);
      } catch (error) {
        console.error('Failed to persist firstMsg for story mode:', error);
      }
    };

    trySendFirstMsg();
  }, [isStoryMode, chat.id, chat.name, chat.settings.firstMsg, storyModeMessages.length, dbPersonalSettings?.userNickname, personalSettings?.userNickname]);

  // 当AI开始回复时，自动滚动到底部
  useEffect(() => {
    if (isLoading || isPending) {
      forceScrollToBottom();
    }
  }, [isLoading, isPending, forceScrollToBottom]);

  // 移除初始化时的强制滚动到底部，避免进入页面时的JS滚动
  // （保留后续基于用户行为/新消息触发的自动滚动逻辑）

  // 加载数据库中的个人信息
  useEffect(() => {
    const loadPersonalSettings = async () => {
      try {
        await dataManager.initDB();
        const settings = await dataManager.getPersonalSettings();
        setDbPersonalSettings(settings);
      } catch (error) {
        console.error('Failed to load personal settings from database:', error);
        // 如果数据库加载失败，使用传入的personalSettings作为后备
        setDbPersonalSettings(personalSettings || {
          userAvatar: '/avatars/user-avatar.svg',
          userNickname: '用户',
          userBio: ''
        });
      }
    };
    
    loadPersonalSettings();
  }, [personalSettings]);

  // 加载用户余额
  useEffect(() => {
    const loadBalance = async () => {
      try {
        await dataManager.initDB();
        const balance = await dataManager.getBalance();
        setCurrentBalance(balance);
      } catch (error) {
        console.error('Failed to load balance:', error);
        setCurrentBalance(0);
      }
    };
    
    loadBalance();
  }, []);

  // 标记消息为已读（优化：减少触发频率）
  useEffect(() => {
    if (chat.messages.length > 0) {
      const markMessagesAsRead = async () => {
        try {
          // 获取当前显示的最新消息时间戳
          const latestMessageTimestamp = Math.max(...chat.messages.map(msg => msg.timestamp));
          
          // 检查是否需要更新（避免不必要的更新）
          const hasUnreadMessages = chat.messages.some(msg => 
            msg.role === 'assistant' && !msg.isRead && msg.timestamp <= latestMessageTimestamp
          );
          
          if (!hasUnreadMessages) return;
          
          // 更新聊天中的未读状态
          const updatedMessages = chat.messages.map(msg => ({
            ...msg,
            isRead: msg.timestamp <= latestMessageTimestamp ? true : msg.isRead
          }));
          
          // 计算未读消息数量
          const unreadCount = updatedMessages.filter(msg => 
            msg.role === 'assistant' && !msg.isRead
          ).length;
          
          // 更新聊天记录
          const updatedChat = {
            ...chat,
            messages: updatedMessages,
            unreadCount,
            lastReadTimestamp: latestMessageTimestamp
          };
          
          onUpdateChat(updatedChat);
          
          // 触发通知系统更新
          window.dispatchEvent(new CustomEvent('viewStateUpdated'));
          
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      };
      
      // 延迟标记已读，确保用户真正看到了消息
      const timer = setTimeout(markMessagesAsRead, 1000);
      return () => clearTimeout(timer);
    }
  }, [chat.messages.length, onUpdateChat, chat]);

  // 加载聊天背景和动画设置
  useEffect(() => {
    const loadBackground = async () => {
      try {
        await dataManager.initDB();
        const background = await dataManager.getChatBackground(chat.id);
        setChatBackground(background || '');
      } catch (error) {
        console.error('Failed to load chat background:', error);
        // 如果数据库加载失败，尝试从localStorage加载
        const fallbackBackground = localStorage.getItem(`chatBackground_${chat.id}`);
        if (fallbackBackground) {
          setChatBackground(fallbackBackground);
        }
      }
      
      // 加载透明度设置
      const opacity = Number(localStorage.getItem(`chatOpacity_${chat.id}`)) || 80;
      setChatOpacity(opacity);
    };
    
    loadBackground();
  }, [chat.id]);

  // 检查并恢复AI pending状态
  useEffect(() => {
    // 检查是否有未完成的AI任务
    if (isPending) {
      console.log(`检测到聊天 ${chat.id} 有未完成的AI任务，恢复pending状态`);
      // 如果有pending状态，设置本地loading状态
      setIsLoading(true);
      // 设置一个默认的AI用户信息
      setCurrentAiUser({
        name: chat.name,
        avatar: chat.settings.aiAvatar || chat.avatar
      });
    }
  }, [chat.id, isPending, chat.name, chat.settings.aiAvatar, chat.avatar]);

  // 本地API配置状态（用于实时更新）
  const [localApiConfig, setLocalApiConfig] = useState<ApiConfig>(apiConfig);
  
  // 监听API配置变更
  useEffect(() => {
    const handleApiConfigChange = async () => {
      try {
        await dataManager.initDB();
        const newApiConfig = await dataManager.getApiConfig();
        console.log('ChatInterface - 监听到API配置变更，更新本地配置:', {
          proxyUrl: newApiConfig.proxyUrl,
          apiKey: newApiConfig.apiKey ? '已设置' : '未设置',
          model: newApiConfig.model
        });
        // 更新本地API配置状态
        setLocalApiConfig(newApiConfig);
      } catch (error) {
        console.error('Failed to reload API config in ChatInterface:', error);
      }
    };

    window.addEventListener('apiConfigChanged', handleApiConfigChange);
    
    return () => {
      window.removeEventListener('apiConfigChanged', handleApiConfigChange);
    };
  }, []);

  // 当props中的apiConfig变化时，同步更新本地状态
  useEffect(() => {
    setLocalApiConfig(apiConfig);
  }, [apiConfig]);

  // 初始化输入框高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // 防抖定时器引用
  const heightAdjustTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mentionCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 处理@提及功能（添加防抖优化）
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // 立即更新消息内容，保证输入响应性
    setMessage(value);
    
    // 防抖处理高度调整，避免频繁DOM操作
    if (heightAdjustTimerRef.current) {
      clearTimeout(heightAdjustTimerRef.current);
    }
    heightAdjustTimerRef.current = setTimeout(() => {
      adjustTextareaHeight();
    }, 100); // 增加到100ms防抖
    
    // 防抖处理@提及检查，避免频繁计算
    if (mentionCheckTimerRef.current) {
      clearTimeout(mentionCheckTimerRef.current);
    }
    
    mentionCheckTimerRef.current = setTimeout(() => {
      if (chat.isGroup && chat.members) {
        // 检查是否在输入@符号
        const beforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = beforeCursor.lastIndexOf('@');
        
        if (lastAtIndex !== -1) {
          const afterAt = beforeCursor.substring(lastAtIndex + 1);
          if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
            setMentionFilter(afterAt);
            setMentionCursorPos(lastAtIndex);
            setShowMentionList(true);
          } else {
            setShowMentionList(false);
          }
        } else {
          setShowMentionList(false);
        }
      }
    }, 150); // 增加到150ms防抖，@提及检查可以稍微慢一点
  }, [chat.isGroup, chat.members, adjustTextareaHeight]);

  // 选择@提及的成员（优化：使用useCallback缓存）
  const selectMention = useCallback((member: GroupMember) => {
    const beforeMention = message.substring(0, mentionCursorPos);
    const afterMention = message.substring(mentionCursorPos + mentionFilter.length + 1);
    const newMessage = beforeMention + `@${member.groupNickname} ` + afterMention;
    
    setMessage(newMessage);
    setShowMentionList(false);
    
    // 延迟调整高度，确保状态更新完成
    setTimeout(() => {
      adjustTextareaHeight();
      textareaRef.current?.focus();
    }, 0);
  }, [message, mentionCursorPos, mentionFilter, adjustTextareaHeight]);

  // 过滤可@的成员（使用useMemo缓存结果，优化依赖项）
  const filteredMembers = useMemo(() => {
    if (!chat.members || !mentionFilter) return [];
    
    // 如果过滤条件为空，返回所有成员
    if (mentionFilter.trim() === '') {
      return chat.members.slice(0, 10); // 限制显示数量
    }
    
    const filterLower = mentionFilter.toLowerCase();
    return chat.members
      .filter(member => member.groupNickname.toLowerCase().includes(filterLower))
      .slice(0, 10); // 限制显示数量，提高性能
  }, [chat.members, mentionFilter]); // 恢复完整依赖项以确保正确性

  // 引用消息（优化：使用useCallback缓存）
  const handleQuoteMessage = useCallback((msg: Message) => {
    if (msg.role === 'user') {
      setQuotedMessage({
        timestamp: msg.timestamp,
        senderName: '我',
        content: msg.content
      });
    } else if (msg.senderName) {
      setQuotedMessage({
        timestamp: msg.timestamp,
        senderName: msg.senderName,
        content: msg.content
      });
    }
  }, []);

  // 取消引用（优化：使用useCallback缓存）
  const cancelQuote = useCallback(() => {
    setQuotedMessage(undefined);
  }, []);

  // 发送红包处理函数
  const handleSendRedPacket = async (amount: number, message: string) => {
    try {
      // 检查余额
      if (amount > currentBalance) {
        throw new Error('余额不足');
      }

      // 扣除余额
      const newBalance = currentBalance - amount;
      await dataManager.saveBalance(newBalance);
      setCurrentBalance(newBalance);

      // 处理用户头像引用
      let userAvatarId: string | undefined;
      if (chat.isGroup && chat.settings.myAvatar) {
        if (!chat.avatarMap) {
          chat.avatarMap = {};
        }
        userAvatarId = `user_${chat.id}`;
        if (!chat.avatarMap[userAvatarId]) {
          chat.avatarMap[userAvatarId] = chat.settings.myAvatar;
        }
      }

      // 创建红包消息
      const redPacketMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `发送了一个红包`,
        timestamp: Date.now(),
        senderName: chat.isGroup ? (chat.settings.myNickname || '我') : undefined,
        senderAvatarId: userAvatarId,
        type: 'red_packet_send',
        redPacketData: {
          id: `redpacket_${Date.now()}`,
          amount: amount,
          message: message,
          senderName: dbPersonalSettings?.userNickname || personalSettings?.userNickname || '我',
          recipientName: chat.name,
          isClaimed: false,
          status: 'pending' as const,
          statusUpdatedAt: Date.now()
        }
      };

      // 添加交易记录
      await dataManager.addTransaction({
        id: `transaction_${Date.now()}`,
        type: 'send',
        amount: amount,
        chatId: chat.id,
        fromUser: dbPersonalSettings?.userNickname || personalSettings?.userNickname || '我',
        toUser: chat.name,
        message: message,
        timestamp: Date.now(),
        status: 'completed'
      });

      // 更新聊天记录
      const updatedChat = {
        ...chat,
        messages: [...chat.messages, redPacketMessage],
        lastMessage: '发送了一个红包',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateChat(updatedChat);

      // 异步触发AI回复，不等待结果
      triggerAiResponse(updatedChat);
    } catch (error) {
      console.error('Send red packet error:', error);
      throw error;
    }
  };

  // 领取红包处理函数
  // 领取红包处理函数（优化：使用useCallback缓存）
  const handleClaimRedPacket = useCallback(async (redPacketId: string) => {
    try {
      // 找到对应的红包消息
      const redPacketMessage = chat.messages.find(msg => 
        msg.redPacketData?.id === redPacketId
      );

      if (!redPacketMessage || !redPacketMessage.redPacketData) {
        throw new Error('红包不存在');
      }

      if (redPacketMessage.redPacketData.isClaimed) {
        throw new Error('红包已被领取');
      }

      // 增加余额
      const newBalance = currentBalance + redPacketMessage.redPacketData.amount;
      await dataManager.saveBalance(newBalance);
      setCurrentBalance(newBalance);

      // 更新红包状态
      const updatedMessages = chat.messages.map(msg => {
        if (msg.redPacketData?.id === redPacketId) {
          return {
            ...msg,
            redPacketData: {
              ...msg.redPacketData,
              isClaimed: true,
              claimedAt: Date.now()
            }
          };
        }
        return msg;
      });

      // 添加交易记录
      await dataManager.addTransaction({
        id: `transaction_${Date.now()}`,
        type: 'receive',
        amount: redPacketMessage.redPacketData.amount,
        chatId: chat.id,
        fromUser: redPacketMessage.redPacketData.senderName,
        toUser: dbPersonalSettings?.userNickname || personalSettings?.userNickname || '我',
        message: redPacketMessage.redPacketData.message,
        timestamp: Date.now(),
        status: 'completed'
      });

      // 更新聊天记录
      const updatedChat = {
        ...chat,
        messages: updatedMessages,
        lastMessage: '领取了红包',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateChat(updatedChat);
    } catch (error) {
      console.error('Claim red packet error:', error);
      throw error;
    }
  }, [chat, currentBalance, onUpdateChat, dbPersonalSettings, personalSettings]);





  // 发送消息（只发送到聊天内容，不调用API）
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isLoading) return;

    // 确保聊天对象有avatarMap
    if (!chat.avatarMap) {
      chat.avatarMap = {};
    }
    
    // 处理用户头像引用
    let userAvatarId: string | undefined;
    if (chat.isGroup && chat.settings.myAvatar) {
      userAvatarId = `user_${chat.id}`;
      // 将用户头像数据存储到映射表中（如果还没有的话）
      if (!chat.avatarMap[userAvatarId]) {
        chat.avatarMap[userAvatarId] = chat.settings.myAvatar;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: Date.now(),
      senderName: chat.isGroup ? (chat.settings.myNickname || '我') : undefined,
      senderAvatarId: userAvatarId,
      quote: quotedMessage,
      isRead: true // 用户发送的消息默认为已读
    };

    // 添加用户消息到聊天记录
    const updatedChat = {
      ...chat,
      messages: [...chat.messages, userMessage],
      lastMessage: message.trim(),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    onUpdateChat(updatedChat);
    setMessage('');
    setQuotedMessage(undefined);
    
    // 标记有新的用户消息待AI回复
    setHasNewUserMessage(true);

    // 重置输入框高度
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);
    
    // 如果开启“发送键生成回复”，则自动触发AI
    if (autoGenerateOnSend && !isPending && !isLoading) {
      // 开始AI任务并清除新消息标志，避免重复
      startAiTask();
      setHasNewUserMessage(false);
      if (triggerAiResponseRef.current) {
        triggerAiResponseRef.current(updatedChat);
      }
    }
  }, [message, isLoading, chat, quotedMessage, onUpdateChat, adjustTextareaHeight, autoGenerateOnSend, isPending, startAiTask]);

  // 生成AI回复（点击生成按钮时调用API）
  const handleGenerateAI = useCallback(async () => {
    if (isLoading || isPending || !hasNewUserMessage) return;

    // 开始AI任务
    startAiTask();
    
    // 清除新用户消息标志，防止重复生成
    setHasNewUserMessage(false);
    
    // 触发AI回复
    if (triggerAiResponseRef.current) {
      triggerAiResponseRef.current(chat);
    }
  }, [isLoading, isPending, hasNewUserMessage, chat, startAiTask]);

  // 剧情模式AI回复处理函数
  const handleStoryModeAiResponse = useCallback(async (aiMessage: Message) => {
    // 将AI回复添加到剧情模式消息列表
    setStoryModeMessages(prev => [...prev, aiMessage]);
    
    // 保存到IndexedDB
    try {
      await dataManager.addStoryModeMessage(chat.id, aiMessage);
      console.log('Story mode AI response saved to IndexedDB');
    } catch (error) {
      console.error('Failed to save story mode AI response to IndexedDB:', error);
    }
    
    // 触发聊天消息通知（仅对AI消息）
    if (aiMessage.role === 'assistant') {
      window.dispatchEvent(new CustomEvent('chatMessageGenerated', {
        detail: {
          characterName: aiMessage.senderName || chat.name,
          chatId: chat.id,
          messageContent: aiMessage.content
        }
      }));
    }
    

  }, [chat]);

  // 触发AI回复的核心函数（优化：使用useCallback缓存）
  const triggerAiResponse = useCallback(async (updatedChat: ChatItem, isStoryModeCall: boolean = false) => {
    // 全局模式：优先使用全局配置，确保所有聊天都使用最新的API设置
    const effectiveApiConfig = {
      proxyUrl: localApiConfig.proxyUrl || updatedChat.settings.proxyUrl,
      apiKey: localApiConfig.apiKey || updatedChat.settings.apiKey,
      model: localApiConfig.model || updatedChat.settings.model
    };

    // 添加调试信息
    console.log('ChatInterface - API配置检查（全局模式）:', {
      globalConfig: {
        proxyUrl: localApiConfig.proxyUrl,
        apiKey: localApiConfig.apiKey ? '已设置' : '未设置',
        model: localApiConfig.model
      },
      chatSettings: {
        proxyUrl: updatedChat.settings.proxyUrl,
        apiKey: updatedChat.settings.apiKey ? '已设置' : '未设置',
        model: updatedChat.settings.model
      },
      effectiveConfig: {
        proxyUrl: effectiveApiConfig.proxyUrl,
        apiKey: effectiveApiConfig.apiKey ? '已设置' : '未设置',
        model: effectiveApiConfig.model,
        hasAllConfig: !!(effectiveApiConfig.proxyUrl && effectiveApiConfig.apiKey && effectiveApiConfig.model),
        usingGlobal: effectiveApiConfig.proxyUrl === localApiConfig.proxyUrl
      }
    });

    if (!effectiveApiConfig.proxyUrl || !effectiveApiConfig.apiKey || !effectiveApiConfig.model) {
      // 如果没有API配置，显示提示消息
      const apiConfigMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '请先设置API配置才能使用AI聊天功能。请在设置中配置代理地址、API密钥和模型名称。',
        timestamp: Date.now(),
        senderName: '系统',
        senderAvatarId: undefined // 系统消息不需要头像
      };

      const chatWithMessage = {
        ...updatedChat,
        messages: [...updatedChat.messages, apiConfigMessage],
        lastMessage: apiConfigMessage.content,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateChat(chatWithMessage);
      
      // 清理AI任务状态，避免页面锁死
      setIsLoading(false);
      setCurrentAiUser(null);
      endAiTask();
      return;
    }

    setIsLoading(true);

    // 在群聊中，随机选择一个AI用户来回复
    if (chat.isGroup && chat.members) {
      const aiMembers = chat.members.filter(m => m.originalName !== (chat.settings.myNickname || '我'));
      if (aiMembers.length > 0) {
        const randomMember = aiMembers[Math.floor(Math.random() * aiMembers.length)];
        setCurrentAiUser({
          name: randomMember.groupNickname,
          avatar: randomMember.avatar
        });
      }
    } else {
      // 单聊中，使用AI角色的头像
      setCurrentAiUser({
        name: chat.name,
        avatar: chat.settings.aiAvatar || chat.avatar
      });
    }

    try {
      // 构建提示词上下文
      const promptContext: PromptContext = {
        chat: updatedChat,
        currentTime: new Date().toLocaleString('zh-CN', { dateStyle: 'full', timeStyle: 'short' }),
        myNickname: dbPersonalSettings?.userNickname || personalSettings?.userNickname || updatedChat.settings.myNickname || '我',
        myPersona: dbPersonalSettings?.userBio || personalSettings?.userBio || updatedChat.settings.myPersona || '用户',
        allChats,
        availableContacts,
        chatStatus,
        currentPreset,
        dbPersonalSettings: dbPersonalSettings || undefined,
        personalSettings,
        isStoryMode: isStoryModeCall // 传递剧情模式标识
      };

      // 使用新的提示词注入系统
      const promptManager = getPromptManager();
      const result = await promptManager.buildPrompt(promptContext);

      const response = await fetch(`${effectiveApiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: effectiveApiConfig.model,
          messages: [
            { role: 'system', content: result.systemPrompt },
            ...result.messagesPayload
          ],
          ...result.apiParams
        })
      });

      const data = await response.json();
      
      // 添加详细的API响应调试信息
      console.log('ChatInterface - API响应数据:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        hasError: !!data.error,
        errorMessage: data.error?.message,
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        firstChoice: data.choices?.[0],
        hasMessage: !!data.choices?.[0]?.message,
        messageContent: data.choices?.[0]?.message?.content
      });
      
      // 检查API是否返回了错误
      if (data.error) {
        let errorMessage = data.error.message || data.error.type || '未知错误';
        const errorCode = data.error.code || '未知';
        
        // 特殊处理内容过滤错误
        if (errorMessage.includes('No candidates returned') || errorCode === 500) {
          errorMessage = '内容被安全策略过滤，请尝试调整角色设定或使用更温和的描述。';
        }
        
        throw new Error(`API服务器错误: ${errorMessage} (代码: ${errorCode})`);
      }
      
      // 检查响应格式
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`API响应格式错误: ${JSON.stringify(data)}`);
      }
      
      const aiResponseContent = data.choices[0].message.content;
      
      // 解析AI回复（支持多条消息）
      const messagesArray = parseAiResponse(aiResponseContent, isStoryModeCall);
      
      if (isStoryModeCall) {
        // 剧情模式：直接处理完整内容，不解析成多条消息
        const aiMessage: Message = {
          id: `${chat.id}_story_ai_${Date.now()}`,
          role: 'assistant',
          content: aiResponseContent,
          timestamp: Date.now(),
          type: 'text',
          senderName: chat.name,
          isRead: true
        };
        
        // 直接添加到剧情模式消息列表
        await handleStoryModeAiResponse(aiMessage);
      } else {
        // 普通模式：解析AI回复（支持多条消息）
        // ★★★ 核心修复：处理每条AI消息，实现一条一条显示 ★★★
        let messageTimestamp = Date.now();
        let currentChat = updatedChat;
        
        for (const msgData of messagesArray) {
          if (!msgData || typeof msgData !== 'object') {
            console.warn("收到了格式不规范的AI指令，已跳过:", msgData);
            continue;
          }
          
          if (!msgData.type) {
            if (chat.isGroup && msgData.name && msgData.message) {
              msgData.type = 'text';
            } else {
              console.warn("收到了格式不规范的AI指令（缺少type），已跳过:", msgData);
              continue;
            }
          }

          // 创建AI消息对象
          const aiMessage = await createAiMessageRef.current!(msgData, currentChat, messageTimestamp++);
          if (aiMessage) {
            // 普通模式：更新聊天记录
            currentChat = {
              ...currentChat,
              messages: [...currentChat.messages, aiMessage],
              lastMessage: aiMessage.content,
              timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            };
            
            // 立即更新UI，显示这条消息
            onUpdateChat(currentChat);
            
            // 触发聊天消息通知（仅对AI消息）
            if (aiMessage.role === 'assistant') {
              window.dispatchEvent(new CustomEvent('chatMessageGenerated', {
                detail: {
                  characterName: aiMessage.senderName || chat.name,
                  chatId: chat.id,
                  messageContent: aiMessage.content
                }
              }));
            }
            
            // 添加延迟，模拟人类打字效果（除了最后一条消息）
            if (messagesArray.indexOf(msgData) < messagesArray.length - 1) {
              await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 500));
            }
          }
        }
      }

    } catch (error) {
      console.error('AI回复失败:', error);
      
      // 根据错误类型提供不同的错误信息
      let errorContent = 'AI回复失败，请检查API配置是否正确。';
      
      if (error instanceof Error) {
        if (error.message.includes('API服务器错误')) {
          errorContent = `AI服务器错误: ${error.message.replace('API服务器错误: ', '')}`;
        } else if (error.message.includes('API响应格式错误')) {
          errorContent = 'AI响应格式错误，请检查模型配置。';
        } else if (error.message.includes('API请求失败')) {
          errorContent = 'API请求失败，请检查网络连接和代理设置。';
        } else {
          errorContent = `AI回复失败: ${error.message}`;
        }
      }
      
      // API请求失败时显示错误提示
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: Date.now(),
        senderName: '系统',
        senderAvatarId: undefined // 系统消息不需要头像
      };

      const chatWithMessage = {
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage],
        lastMessage: errorMessage.content,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateChat(chatWithMessage);
    } finally {
      setIsLoading(false);
      setCurrentAiUser(null); // 清除当前AI用户信息
      endAiTask(); // 结束AI任务
    }
  }, [localApiConfig, chat, dbPersonalSettings, personalSettings, allChats, availableContacts, chatStatus, currentPreset, onUpdateChat, endAiTask, handleStoryModeAiResponse]);

  // 将triggerAiResponse赋值给useRef，避免循环依赖
  useEffect(() => {
    triggerAiResponseRef.current = triggerAiResponse;
  }, [triggerAiResponse]);









  // 解析AI回复（参考V0.03文件的强大解析逻辑）
  const parseAiResponse = (content: string, isStoryMode: boolean = false) => {
    // 剧情模式不需要解析，直接返回原始内容
    if (isStoryMode) {
      console.log("剧情模式：直接返回原始内容，不进行解析");
      return [{ type: 'text', content: content }];
    }

    const trimmedContent = content.trim();

    // 方案1：【最优先】尝试作为标准的、单一的JSON数组解析
    // 这是最理想、最高效的情况
    if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmedContent);
        if (Array.isArray(parsed)) {
          console.log("解析成功：标准JSON数组格式。");
          return parsed;
        }
      } catch {
        // 如果解析失败，说明它虽然看起来像个数组，但内部格式有问题。
        // 此时我们不报错，而是继续尝试下面的"强力解析"方案。
        console.warn("标准JSON数组解析失败，将尝试强力解析...");
      }
    }

    // 方案2：【强力解析】使用正则表达式，从混乱的字符串中提取出所有独立的JSON对象
    // 这能完美解决您遇到的 "(Timestamp: ...)[{...}](Timestamp: ...)[{...}]" 这种格式
    const jsonMatches = trimmedContent.match(/{[^{}]*}/g);

    if (jsonMatches) {
      const results = [];
      for (const match of jsonMatches) {
        try {
          // 尝试解析每一个被我们"揪"出来的JSON字符串
          const parsedObject = JSON.parse(match);
          results.push(parsedObject);
        } catch {
          // 如果某个片段不是有效的JSON，就忽略它，继续处理下一个
          console.warn("跳过一个无效的JSON片段:", match);
        }
      }

      // 如果我们成功提取出了至少一个有效的JSON对象，就返回这个结果
      if (results.length > 0) {
        console.log("解析成功：通过强力提取模式。");
        return results;
      }
    }
    
    // 方案3：【最终备用】如果以上所有方法都失败了，说明AI返回的可能就是纯文本
    // 我们将原始的、未处理的内容，包装成一个标准的文本消息对象返回，确保程序不会崩溃
    console.error("所有解析方案均失败！将返回原始文本。");
    return [{ type: 'text', content: content }];
  };

  // 创建AI消息对象
  // 创建AI消息对象（优化：使用useCallback缓存）
  const createAiMessage = useCallback(async (msgData: Record<string, unknown>, chat: ChatItem, timestamp: number): Promise<Message | null> => {
    // 根据消息类型处理内容
    let content = '';
    let type: Message['type'] = 'text';
    let meaning: string | undefined;
    let url: string | undefined;
    
    // 获取头像ID和确保头像映射表存在
    const senderName = String(msgData.name || chat.name);
    let senderAvatarId: string | undefined;
    
    // 确保聊天对象有avatarMap
    if (!chat.avatarMap) {
      chat.avatarMap = {};
    }
    
    if (chat.isGroup && chat.members) {
      const member = chat.members.find(m => m.originalName === senderName);
      if (member && member.avatar) {
        senderAvatarId = `member_${member.originalName}`;
        // 将头像数据存储到映射表中（如果还没有的话）
        if (!chat.avatarMap[senderAvatarId]) {
          chat.avatarMap[senderAvatarId] = member.avatar;
        }
      }
    } else {
      // 单聊情况
      if (chat.settings.aiAvatar) {
        senderAvatarId = `ai_${chat.id}`;
        // 将头像数据存储到映射表中（如果还没有的话）
        if (!chat.avatarMap[senderAvatarId]) {
          chat.avatarMap[senderAvatarId] = chat.settings.aiAvatar;
        }
      }
    }

    switch (msgData.type) {
      case 'text':
        // 确保content字段是纯文本，不是JSON代码
        const textContent = msgData.content || msgData.message || '';
        content = String(textContent);
        // 如果content看起来像JSON，尝试提取纯文本
        if (content.startsWith('{') || content.startsWith('[')) {
          try {
            const parsed = JSON.parse(content);
            if (typeof parsed === 'object') {
              // 如果是对象，尝试提取message或content字段
              content = String(parsed.message || parsed.content || textContent);
            }
          } catch {
            // 如果解析失败，保持原内容
            content = String(textContent);
          }
        }
        type = 'text';
        break;
      case 'sticker':
        content = String(msgData.meaning || '表情');
        type = 'sticker';
        meaning = msgData.meaning ? String(msgData.meaning) : undefined;
        // AI回复不允许使用链接图片，所以不设置url
        url = undefined;
        break;
      case 'ai_image':
        content = String(msgData.description || '图片');
        type = 'ai_image';
        break;
      case 'voice_message':
        content = String(msgData.content || '语音消息');
        type = 'voice_message';
        break;
      case 'pat_user':
        content = `拍一拍${msgData.suffix ? String(msgData.suffix) : ''}`;
        type = 'text';
        break;
      case 'send_red_packet':
        // AI发送红包命令
        const amount = Number(msgData.amount) || 0;
        const redPacketMessage = String(msgData.message || '恭喜发财！');
        
        if (amount > 0) {
          // 注意：不在这里增加用户余额，等用户点击领取时再增加
          // 这样避免重复增加余额的问题
          
          content = `发送了一个红包`;
          type = 'red_packet_receive';
          
          // 返回带有红包数据的消息
          return {
            id: timestamp.toString(),
            role: 'assistant',
            content,
            timestamp,
            senderName: String(msgData.name || chat.name),
            senderAvatarId: senderAvatarId,
            type,
            redPacketData: {
              id: `redpacket_${timestamp}`,
              amount: amount,
              message: redPacketMessage,
              senderName: String(msgData.name || chat.name),
              recipientName: dbPersonalSettings?.userNickname || personalSettings?.userNickname || '我',
              isClaimed: false
            }
          };
        }
        break;
      case 'request_red_packet':
        // AI请求红包命令
        content = `请求红包`;
        type = 'red_packet_request';
        
        return {
          id: timestamp.toString(),
          role: 'assistant',
          content,
          timestamp,
          senderName: String(msgData.name || chat.name),
          senderAvatarId: senderAvatarId,
          type,
          redPacketData: {
            id: `redpacket_request_${timestamp}`,
            amount: 0,
            message: String(msgData.message || '求红包～'),
            senderName: String(msgData.name || chat.name),
            recipientName: dbPersonalSettings?.userNickname || personalSettings?.userNickname || '我',
            isClaimed: false
          }
        };
      case 'accept_red_packet':
        // AI接收红包命令
        const acceptMessage = String(msgData.message || '谢谢红包！');
        
        // 创建AI红包响应消息
        type = 'ai_red_packet_response';
        content = JSON.stringify({
          action: 'accepted',
          amount: 0, // 将在后续处理中获取实际金额
          message: acceptMessage,
          timestamp: timestamp
        });
        break;
      case 'decline_red_packet':
        // AI拒绝红包命令
        const declineRedPacketId = String(msgData.red_packet_id || '');
        const declineMessage = String(msgData.message || '不好意思，我不能收这个红包');
        
        // 查找对应的红包并返还余额
        let refundAmount = 0;
        const targetRedPacket = chat.messages.find(msg => 
          msg.type === 'red_packet_send' && 
          msg.redPacketData && 
          (msg.redPacketData.id === declineRedPacketId || 
           msg.redPacketData.id.includes(declineRedPacketId.replace(/[^0-9]/g, '')))
        );
        
        if (targetRedPacket && targetRedPacket.redPacketData) {
          refundAmount = targetRedPacket.redPacketData.amount;
          
          // 返还余额到数据库
          try {
            await dataManager.initDB();
            const currentBalance = await dataManager.getBalance();
            await dataManager.saveBalance(currentBalance + refundAmount);
            
            // 更新本地余额状态
            setCurrentBalance(currentBalance + refundAmount);
            
            // 记录交易
            await dataManager.addTransaction({
              id: `refund_${Date.now()}`,
              type: 'receive',
              amount: refundAmount,
              chatId: chat.id,
              fromUser: String(msgData.name || chat.name),
              toUser: dbPersonalSettings?.userNickname || personalSettings?.userNickname || '我',
              message: '红包被拒绝，金额已返还',
              timestamp: Date.now(),
              status: 'completed'
            });
            
            console.log(`AI拒绝红包，返还金额: ¥${refundAmount.toFixed(2)}`);
          } catch (error) {
            console.error('返还余额失败:', error);
          }
        }
        
        // 创建AI红包响应消息
        type = 'ai_red_packet_response';
        content = JSON.stringify({
          action: 'rejected',
          amount: refundAmount,
          message: declineMessage,
          timestamp: timestamp
        });
        break;
      case 'status_update':
        // AI状态更新命令
        const newMood = String(msgData.mood || chatStatus.mood);
        const newLocation = String(msgData.location || chatStatus.location);
        const newOutfit = String(msgData.outfit || chatStatus.outfit);
        
        // 更新聊天状态
        const updatedStatus: ChatStatus = {
          isOnline: true,
          mood: newMood,
          location: newLocation,
          outfit: newOutfit,
          lastUpdate: Date.now()
        };
        
        setChatStatus(updatedStatus);
        
        // 保存到数据库
        try {
          await dataManager.initDB();
          await dataManager.saveChatStatus(chat.id, updatedStatus);
        } catch (error) {
          console.error('Failed to save chat status:', error);
        }
        
        // 不创建消息，只更新状态
        return null;
      default:
        // 默认情况下也处理可能的JSON内容
        const defaultContent = msgData.content || msgData.message || '';
        content = String(defaultContent);
        if (content.startsWith('{') || content.startsWith('[')) {
          try {
            const parsed = JSON.parse(content);
            if (typeof parsed === 'object') {
              content = String(parsed.message || parsed.content || defaultContent);
            }
          } catch {
            content = String(defaultContent);
          }
        }
        type = 'text';
    }

    const aiMessage: Message = {
      id: timestamp.toString(),
      role: 'assistant',
      content,
      timestamp,
      senderName: senderName,
      senderAvatarId: senderAvatarId,
      type,
      meaning,
      url,
      isRead: false // AI消息默认为未读
    };

    return aiMessage;
  }, [dbPersonalSettings, personalSettings, chatStatus]);

  // 将createAiMessage赋值给useRef，避免循环依赖
  useEffect(() => {
    createAiMessageRef.current = createAiMessage;
  }, [createAiMessage]);



  // 处理键盘事件（优化：使用useCallback缓存）
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 编辑用户消息（优化：使用useCallback缓存）
  const handleEditMessage = useCallback((messageId: string, currentContent: string) => {
    setEditingMessage({ id: messageId, content: currentContent });
  }, []);

  // 保存编辑的消息（优化：使用useCallback缓存）
  const handleSaveEdit = useCallback(() => {
    if (!editingMessage) return;

    const updatedChat = {
      ...chat,
      messages: chat.messages.map(msg => 
        msg.id === editingMessage.id 
          ? { ...msg, content: editingMessage.content }
          : msg
      )
    };
    onUpdateChat(updatedChat);
    setEditingMessage(null);
  }, [editingMessage, chat, onUpdateChat]);

  // 取消编辑（优化：使用useCallback缓存）
  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);

  // 删除消息（优化：使用useCallback缓存）
  const handleDeleteMessage = useCallback((messageId: string) => {
    if (confirm('确定要删除这条消息吗？')) {
      const updatedChat = {
        ...chat,
        messages: chat.messages.filter(msg => msg.id !== messageId)
      };
      onUpdateChat(updatedChat);
    }
  }, [chat, onUpdateChat]);

  // 批量删除消息
  const handleBatchDelete = useCallback((messageIds: string[]) => {
    const updatedChat = {
      ...chat,
      messages: chat.messages.filter(msg => !messageIds.includes(msg.id))
    };
    onUpdateChat(updatedChat);
    setShowBatchDelete(false);
  }, [chat, onUpdateChat]);

  // 开始批量删除
  const handleStartBatchDelete = useCallback(() => {
    setShowBatchDelete(true);
  }, []);

  // ==================== 剧情模式下的消息操作 ====================
  // 保存剧情模式编辑的消息
  const handleStorySaveEdit = useCallback(async () => {
    if (!editingMessage) return;
    try {
      const updatedMessages = storyModeMessages.map(msg =>
        msg.id === editingMessage.id
          ? { ...msg, content: editingMessage.content }
          : msg
      );
      setStoryModeMessages(updatedMessages);
      await dataManager.saveStoryModeMessages(chat.id, updatedMessages);
    } catch (error) {
      console.error('保存剧情模式编辑消息失败:', error);
    } finally {
      setEditingMessage(null);
    }
  }, [editingMessage, storyModeMessages, chat.id]);

  // 删除剧情模式消息
  const handleStoryDeleteMessage = useCallback(async (messageId: string) => {
    if (!confirm('确定要删除这条剧情消息吗？')) return;
    try {
      const updated = storyModeMessages.filter(m => m.id !== messageId);
      setStoryModeMessages(updated);
      await dataManager.saveStoryModeMessages(chat.id, updated);
    } catch (error) {
      console.error('删除剧情模式消息失败:', error);
    }
  }, [storyModeMessages, chat.id]);

  // 剧情模式下重新生成AI回复
  const handleStoryRegenerateAI = useCallback(async (messageId: string) => {
    // 找到要重新生成的消息在剧情列表中的位置
    const messageIndex = storyModeMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // 删除该消息及之后的所有AI消息（保持与普通模式一致的行为）
    const messagesToKeep = storyModeMessages.slice(0, messageIndex);
    setStoryModeMessages(messagesToKeep);
    try {
      await dataManager.saveStoryModeMessages(chat.id, messagesToKeep);
    } catch (error) {
      console.error('更新剧情模式消息失败:', error);
    }

    // 使用剧情模式上下文重新触发AI
    const storyModeChat = {
      ...chat,
      messages: messagesToKeep
    };
    await triggerAiResponse(storyModeChat, true);
  }, [storyModeMessages, chat, triggerAiResponse]);

  // 处理图片消息点击
  // 处理图片消息点击（优化：使用useCallback缓存）
  const handleImageMessageClick = useCallback((content: string, senderName?: string) => {
    // 创建一个更美观的弹窗来显示图片描述
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.2s ease;
    `;
    
    modalContent.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="font-size: 24px;">📷</div>
        <div>
          <h3 style="margin: 0; color: #333; font-size: 18px;">${senderName || '对方'} 发送的图片</h3>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">图片内容描述</p>
        </div>
      </div>
      <div style="
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
        border-left: 4px solid #28a745;
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        white-space: pre-wrap;
        word-break: break-word;
      ">${content}</div>
      <button onclick="this.closest('.image-modal').remove()" style="
        margin-top: 16px;
        padding: 8px 16px;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      " onmouseover="this.style.backgroundColor='#218838'" onmouseout="this.style.backgroundColor='#28a745'">
        关闭
      </button>
    `;
    
    modal.className = 'image-modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 点击背景关闭弹窗
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // ESC键关闭弹窗
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }, []);

  // 处理世界书关联更新（优化：使用useCallback缓存）
  const handleWorldBookAssociationUpdate = useCallback((worldBookIds: string[]) => {
    const updatedChat = {
      ...chat,
      settings: {
        ...chat.settings,
        linkedWorldBookIds: worldBookIds
      }
    };
    onUpdateChat(updatedChat);
  }, [chat, onUpdateChat]);

  // 处理加载更多历史消息
  const handleLoadMoreMessages = useCallback((olderMessages: Message[]) => {
    if (olderMessages.length === 0) return;

    console.log('Loading more messages:', olderMessages.length, 'messages');

    // 设置加载更多消息状态，防止自动滚动干扰
    setIsLoadingMoreMessages(true);

    // 将新消息插入到当前显示消息列表的开头
    setDisplayedMessages(prev => {
      const newMessages = [...olderMessages, ...prev];
      
      // 检查是否还有更多消息可以加载
      const totalMessages = chat.messages.length;
      const displayedCount = newMessages.length;
      setHasMoreMessages(displayedCount < totalMessages);
      
      console.log('Updated displayed messages:', {
        totalMessages,
        displayedCount,
        hasMore: displayedCount < totalMessages
      });
      
      return newMessages;
    });

    // 延迟恢复状态，确保滚动位置调整完成
    setTimeout(() => {
      setIsLoadingMoreMessages(false);
    }, 500); // 500ms后恢复
  }, [chat.messages.length]);

  // 处理滚动位置更新（保持用户当前查看的位置）
  const handleUpdateScrollPosition = useCallback((oldHeight: number, newHeight: number) => {
    if (!messagesContainerRef.current) return;

    const heightDifference = newHeight - oldHeight;
    const currentScrollTop = messagesContainerRef.current.scrollTop;
    
    console.log('Updating scroll position:', {
      oldHeight,
      newHeight,
      heightDifference,
      currentScrollTop,
      newScrollTop: currentScrollTop + heightDifference
    });
    
    // 清除之前的定时器
    if (scrollUpdateTimerRef.current) {
      clearTimeout(scrollUpdateTimerRef.current);
    }
    
    // 使用防抖机制，延迟更新滚动位置
    scrollUpdateTimerRef.current = setTimeout(() => {
      if (messagesContainerRef.current) {
        // 调整滚动位置，保持用户当前查看的内容在相同位置
        messagesContainerRef.current.scrollTop = currentScrollTop + heightDifference;
      }
    }, 50); // 50ms防抖延迟
  }, []);

  // 处理语音消息点击（优化：使用useCallback缓存）
  const handleVoiceMessageClick = useCallback((content: string, senderName?: string) => {
    // 创建一个更美观的弹窗来显示语音内容
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.2s ease;
    `;
    
    modalContent.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="font-size: 24px;">🎤</div>
        <div>
          <h3 style="margin: 0; color: #333; font-size: 18px;">${senderName || '对方'} 的语音</h3>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">语音消息的文字内容</p>
        </div>
      </div>
      <div style="
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
        border-left: 4px solid #007bff;
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        white-space: pre-wrap;
        word-break: break-word;
      ">${content}</div>
      <button onclick="this.closest('.voice-modal').remove()" style="
        margin-top: 16px;
        padding: 8px 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      " onmouseover="this.style.backgroundColor='#0056b3'" onmouseout="this.style.backgroundColor='#007bff'">
        关闭
      </button>
    `;
    
    modal.className = 'voice-modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 点击背景关闭弹窗
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // ESC键关闭弹窗
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }, []);

  // 重新生成AI回复
  // 重新生成AI回复（优化：使用useCallback缓存）
  const handleRegenerateAI = useCallback(async (messageId: string) => {
    // 找到要重新生成的消息
    const messageIndex = chat.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // 删除该消息及之后的所有AI消息
    const messagesToKeep = chat.messages.slice(0, messageIndex);
    const updatedChat = {
      ...chat,
      messages: messagesToKeep
    };
    onUpdateChat(updatedChat);

    // 重新触发AI回复
    await triggerAiResponse(updatedChat);
  }, [chat, onUpdateChat, triggerAiResponse]);

  // 剧情模式相关函数
  const handleStoryModeToggle = useCallback(async () => {
    const newStoryMode = !isStoryMode;
    
    // 保存模式切换记录
    try {
      await dataManager.saveModeTransition(chat.id, isStoryMode ? 'story' : 'normal', newStoryMode ? 'story' : 'normal');
      console.log(`模式切换记录已保存: ${isStoryMode ? 'story' : 'normal'} -> ${newStoryMode ? 'story' : 'normal'}`);
    } catch (error) {
      console.error('保存模式切换记录失败:', error);
    }
    
    setIsStoryMode(newStoryMode);
    
    // 切换模式时清空输入内容，但保留消息记忆
    setStoryModeInput('');
    setMessage('');
    
    // 模式切换后自动滚动到最新消息
    setTimeout(() => {
      forceScrollToBottom();
    }, 100); // 延迟100ms确保状态更新完成
    
    // 显示模式切换提示
    const transitionMessage = newStoryMode 
      ? '已切换到剧情模式（线下），AI将记住之前的聊天内容'
      : '已切换到聊天模式（线上），AI将记住之前的剧情发展';
    
    console.log(transitionMessage);
  }, [isStoryMode, chat.id, forceScrollToBottom]);

  const handleStoryModeSend = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // 确保聊天对象有avatarMap
    if (!chat.avatarMap) {
      chat.avatarMap = {};
    }
    
    // 处理用户头像引用
    let userAvatarId: string | undefined;
    if (chat.isGroup && chat.settings.myAvatar) {
      userAvatarId = `user_${chat.id}`;
      if (!chat.avatarMap[userAvatarId]) {
        chat.avatarMap[userAvatarId] = chat.settings.myAvatar;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      senderName: chat.isGroup ? (chat.settings.myNickname || '我') : undefined,
      senderAvatarId: userAvatarId,
      quote: quotedMessage,
      isRead: true
    };

    // 先构造更新后的剧情消息列表，便于后续可能的自动生成
    const updatedStoryMessages = [...storyModeMessages, userMessage];
    
    // 添加用户消息到剧情模式消息记录
    setStoryModeMessages(updatedStoryMessages);
    
    // 保存到IndexedDB
    try {
      await dataManager.addStoryModeMessage(chat.id, userMessage);
      console.log('Story mode message saved to IndexedDB');
    } catch (error) {
      console.error('Failed to save story mode message to IndexedDB:', error);
    }
    
    setQuotedMessage(undefined);
    
    // 标记有新的用户消息待AI回复
    setHasNewUserMessage(true);
    
    // 清空输入框
    setStoryModeInput('');
    
    // 如果开启“发送键生成回复”，则自动触发剧情模式AI
    if (autoGenerateOnSend && !isPending && !isLoading) {
      startAiTask();
      setHasNewUserMessage(false);
      if (triggerAiResponseRef.current) {
        const storyModeChat = {
          ...chat,
          messages: updatedStoryMessages
        };
        triggerAiResponseRef.current(storyModeChat, true);
      }
    }
  }, [isLoading, chat, quotedMessage, autoGenerateOnSend, isPending, startAiTask, storyModeMessages]);

  const handleStoryModeGenerate = useCallback(async () => {
    if (isLoading || isPending || !hasNewUserMessage) return;

    // 开始AI任务
    startAiTask();
    
    // 清除新用户消息标志，防止重复生成
    setHasNewUserMessage(false);
    
    // 触发AI回复，但使用剧情模式的消息列表
    if (triggerAiResponseRef.current) {
      // 创建一个临时的聊天对象，使用剧情模式的消息
      const storyModeChat = {
        ...chat,
        messages: storyModeMessages
      };
      triggerAiResponseRef.current(storyModeChat, true); // 传递true表示是剧情模式调用
    }
  }, [isLoading, isPending, hasNewUserMessage, chat, storyModeMessages, startAiTask]);



  // 缓存formatTime函数，避免每次渲染都创建新函数
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // 缓存renderMessageContent函数，避免每次渲染都创建新函数
  const renderMessageContent = useCallback((msg: Message) => {
    switch (msg.type) {
      case 'sticker':
        return (
          <div className="sticker-message">
            {/* AI回复不允许显示链接图片，只显示文字 */}
            <span className="sticker-text">
              {msg.meaning || '表情'}
            </span>
          </div>
        );
      case 'ai_image':
        return (
          <div className="image-message" onClick={() => handleImageMessageClick(msg.content, msg.senderName)}>
            <div className="image-placeholder">
              <div className="image-icon">📷</div>
              <div className="image-description">图片</div>
              <div className="image-hint">点击查看描述</div>
            </div>
          </div>
        );
      case 'voice_message':
        return (
          <div className="voice-message" onClick={() => handleVoiceMessageClick(msg.content, msg.senderName)}>
            <div className="voice-message-body">
              <div className="voice-waveform">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              <span className="voice-duration">
                {Math.max(1, Math.round((msg.content || '').length / 5))}&apos;&apos; 
              </span>
            </div>
          </div>
        );
      case 'red_packet_send':
      case 'red_packet_receive':
      case 'red_packet_request':
        return (
          <RedPacketMessage
            message={msg}
            chat={chat}
            onClaim={handleClaimRedPacket}
            onSend={() => setShowSendRedPacket(true)}
            isUserMessage={msg.role === 'user'}
          />
        );
      case 'ai_red_packet_response':
        try {
          const responseData = JSON.parse(msg.content);
          return (
            <AiRedPacketResponse
              action={responseData.action}
              amount={responseData.amount}
              message={responseData.message}
              timestamp={responseData.timestamp}
            />
          );
        } catch (error) {
          console.error('Failed to parse AI red packet response:', error);
          return <span>AI红包响应解析失败</span>;
        }
      case 'image':
          return (
            <div className="image-message">
              <Image 
                src={msg.content} 
                alt="用户图片" 
                width={200}
                height={200}
                className="user-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('fallback-hidden');
                }}
              />
              <span className="image-fallback fallback-hidden">图片加载失败</span>
            </div>
          );
      default:
        // 处理换行符，将\n转换为<br>标签，就像V0.03文件一样
        const contentWithBreaks = String(msg.content || '').split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < String(msg.content || '').split('\n').length - 1 && <br />}
          </React.Fragment>
        ));
        return <span>{contentWithBreaks}</span>;
    }
  }, [handleImageMessageClick, handleVoiceMessageClick, handleClaimRedPacket, chat]);

  // 初始化显示的消息（只显示最新的50条）
  useEffect(() => {
    const INITIAL_MESSAGE_COUNT = 50;
    const messages = chat.messages;
    
    if (messages.length <= INITIAL_MESSAGE_COUNT) {
      // 如果消息数量不多，显示所有消息
      setDisplayedMessages(messages);
      setHasMoreMessages(false);
    } else {
      // 如果消息数量很多，只显示最新的50条
      const latestMessages = messages.slice(-INITIAL_MESSAGE_COUNT);
      setDisplayedMessages(latestMessages);
      setHasMoreMessages(true);
    }
    
    // 如果用户没有手动滚动，确保滚动到底部
    if (shouldAutoScroll && messages.length > 0) {
      console.log('Ensuring scroll to bottom after displayed messages update');
      setTimeout(() => {
        scrollToBottom(false); // 使用即时滚动，不使用动画
      }, 100);
    }
  }, [chat.messages, shouldAutoScroll]);

  return (
    <ChatBackgroundManager
      chatId={chat.id}
      onBackgroundChange={(background, opacity) => {
        setChatBackground(background);
        setChatOpacity(opacity || 80);
      }}
    >
      <div className="chat-interface" style={{ backgroundColor: 'transparent' }}>
      {/* 顶部导航栏 */}
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>‹</button>
        <div className="chat-info">
          <Image 
            src={chat.avatar} 
            alt={chat.name}
            width={40}
            height={40}
            className="chat-avatar"
            unoptimized={chat.avatar?.startsWith('data:')}
          />
          <div className="chat-details">
            <span className="chat-name">{chat.name}</span>
            {chat.isGroup && chat.members ? (
              <span className="chat-status">{`${chat.members.length}人`}</span>
            ) : (
              <ChatStatusDisplay status={chatStatus} chatName={chat.name} />
            )}
          </div>
        </div>
                  <div className="chat-actions">
          <button 
            className="action-btn"
            onClick={() => setShowWorldBookAssociationSwitch(true)}
            title="世界书关联管理"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </button>
          <button 
            className="action-btn"
            onClick={() => setShowBackgroundModal(true)}
            title="设置聊天背景"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </button>
          <button 
            className="action-btn"
            onClick={() => setShowGiftHistory(true)}
            title="查看礼物记录"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,12 20,22 4,22 4,12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </button>

          {chat.isGroup ? (
            <>
              <button 
                className="action-btn"
                onClick={() => setShowMemoryManager(true)}
                title="记忆管理"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </button>
              <button 
                className="action-btn"
                onClick={() => setShowMemberManager(true)}
                title="群成员管理"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </button>
            </>
          ) : (
            <button 
              className="action-btn"
              onClick={() => setShowSingleChatMemoryManager(true)}
              title="群聊记忆管理"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </button>
          )}
        </div>
      </div>



      {/* 消息列表 */}
      <div className="messages-container" ref={messagesContainerRef} onScroll={handleScroll}>
        {isStoryMode ? (
          // 剧情模式显示
          <StoryModeDisplay
            messages={storyModeMessages}
            chat={chat}
            onQuoteMessage={handleQuoteMessage}
            onEditMessage={handleEditMessage}
            onSaveEdit={handleStorySaveEdit}
            onCancelEdit={handleCancelEdit}
            onDeleteMessage={handleStoryDeleteMessage}
            onRegenerateAI={handleStoryRegenerateAI}
            editingMessage={editingMessage}
            setEditingMessage={setEditingMessage}
          />
        ) : (
          // 普通聊天模式显示
          <>
            {chat.messages.length === 0 ? (
              <div className="empty-chat">
                <p>开始和 {chat.name} 聊天吧！</p>
              </div>
            ) : (
              <>
                {/* 消息分页管理器 */}
                <MessagePaginationManager
                  chat={chat}
                  onLoadMoreMessages={handleLoadMoreMessages}
                  onUpdateScrollPosition={handleUpdateScrollPosition}
                  isEnabled={isPaginationEnabled && hasMoreMessages}
                  displayedMessages={displayedMessages}
                  messagesContainerRef={messagesContainerRef}
                />
                
                {!shouldAutoScroll && (
                  <button 
                    className="scroll-to-bottom-btn"
                    onClick={() => scrollToBottom(true)}
                    title="滚动到最新消息"
                  >
                    ↓
                  </button>
                )}
                
                {/* 优化消息渲染，支持分页加载 */}
                {displayedMessages.map((msg, index) => (
                  <MessageItem
                    key={msg.id}
                    data-message-id={msg.id}
                    msg={msg}
                    chat={chat}
                    index={index}
                    _totalMessages={displayedMessages.length}
                    dbPersonalSettings={dbPersonalSettings}
                    personalSettings={personalSettings}
                    editingMessage={editingMessage}
                    onQuoteMessage={handleQuoteMessage}
                    onEditMessage={handleEditMessage}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onDeleteMessage={handleDeleteMessage}
                    onRegenerateAI={handleRegenerateAI}
                    onStartBatchDelete={handleStartBatchDelete}
                    renderMessageContent={renderMessageContent}
                    formatTime={formatTime}
                    setEditingMessage={setEditingMessage}
                  />
                ))}
              </>
            )}
          </>
        )}
        
        {/* AI正在输入指示器 */}
        {(isLoading || isPending) && !isStoryMode && (
          <div className={`message ai-message ${chat.isGroup ? 'group-message' : ''}`}>
            <div className="message-avatar">
              <Image 
                src={currentAiUser?.avatar || chat.avatar}
                alt={currentAiUser?.name || chat.name}
                width={42}
                height={42}
                className="avatar-image"
                unoptimized={(currentAiUser?.avatar || chat.avatar)?.startsWith('data:')}
              />
            </div>
            <div className="message-content">
              {chat.isGroup && (
                <div className="message-sender">{currentAiUser?.name || chat.name}</div>
              )}
              <div className="message-bubble typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                {/* 添加取消按钮，允许用户手动取消AI任务 */}
                <button 
                  className="cancel-ai-btn"
                  onClick={() => {
                    setIsLoading(false);
                    setCurrentAiUser(null);
                    endAiTask();
                  }}
                  title="取消AI回复"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="input-container">
        {/* 引用消息显示 */}
        {quotedMessage && (
          <div className="quote-preview">
            <div className="quote-preview-content">
              <span className="quote-preview-sender">{quotedMessage.senderName}:</span>
              <span className="quote-preview-text">{quotedMessage.content}</span>
            </div>
            <button className="quote-cancel" onClick={cancelQuote}>×</button>
          </div>
        )}
        
        {/* @提及列表 */}
        {showMentionList && chat.isGroup && (
          <div className="mention-list">
            {filteredMembers.map(member => (
              <div 
                key={member.id}
                className="mention-item"
                onClick={() => selectMention(member)}
              >
                <Image 
                  src={member.avatar}
                  alt={member.groupNickname}
                  width={24}
                  height={24}
                  className="mention-avatar"
                />
                <span className="mention-name">{member.groupNickname}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* 功能按钮行 */}
        <div className="action-buttons-row">
          <div className="action-buttons-left">
            {!isStoryMode && (
              <button 
                className="action-btn red-packet-btn"
                onClick={() => setShowSendRedPacket(true)}
                disabled={isLoading || isPending}
                title="发送红包"
              >
                <span className="btn-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,12 20,22 4,22 4,12"/>
                    <rect x="2" y="7" width="20" height="5"/>
                    <line x1="12" y1="22" x2="12" y2="7"/>
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                  </svg>
                </span>
                <span className="btn-text">红包</span>
              </button>
            )}
            {/* 预留位置给未来的功能按钮 */}
          </div>
          <div className="action-buttons-right">
            <StoryModeToggle
              isStoryMode={isStoryMode}
              onToggle={handleStoryModeToggle}
              disabled={isLoading || isPending}
            />
            <div className="reply-trigger-toggle" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
              <label title={autoGenerateOnSend ? '发送消息后自动调用AI生成回复' : '发送消息后需要点击AI生成按钮'} style={{ display: 'flex', alignItems: 'center', cursor: (isLoading || isPending) ? 'not-allowed' : 'pointer', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={autoGenerateOnSend}
                  onChange={(e) => setAutoGenerateOnSend(e.target.checked)}
                  disabled={isLoading || isPending}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {autoGenerateOnSend ? '发送即生成' : '按键生成'}
                </span>
              </label>
            </div>
          </div>
        </div>
        
        {/* 输入框和发送按钮行 */}
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={isStoryMode ? storyModeInput : message}
            onChange={isStoryMode ? (e) => {
              setStoryModeInput(e.target.value);
            } : handleInputChange}
            onKeyPress={isStoryMode ? (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (storyModeInput.trim()) {
                  handleStoryModeSend(storyModeInput);
                }
              }
            } : handleKeyPress}
            onFocus={() => {
              // 手机端输入框聚焦时滚动到视口
              setTimeout(() => {
                textareaRef.current?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
                });
              }, 300);
            }}
            placeholder={
              isPending 
                ? (isStoryMode ? "AI正在生成剧情中，请稍候..." : "AI正在回复中，请稍候...")
                : (isStoryMode ? "继续编写剧情..." : (chat.isGroup ? "输入消息，@可提及群成员..." : "输入消息..."))
            }
            rows={1}
            disabled={isLoading || isPending}
            style={{
              resize: 'none',
              overflow: 'hidden',
              minHeight: '40px',
              maxHeight: '120px'
            }}
          />
          <div className="send-buttons">
            <button 
              className="send-btn"
              onClick={isStoryMode ? () => {
                // 剧情模式发送逻辑
                if (storyModeInput.trim()) {
                  handleStoryModeSend(storyModeInput);
                }
              } : handleSendMessage}
              disabled={isLoading || isPending || (isStoryMode ? !storyModeInput.trim() : !message.trim())}
              title={isStoryMode ? "继续剧情" : "发送消息"}
            >
              <span className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                </svg>
              </span>
              <span className="btn-text">{isStoryMode ? "继续" : "发送"}</span>
            </button>
            {!autoGenerateOnSend && (
              <button 
                className="generate-btn"
                onClick={isStoryMode ? handleStoryModeGenerate : handleGenerateAI}
                disabled={isLoading || isPending || !hasNewUserMessage || chat.messages.length === 0}
                title={
                  isStoryMode 
                    ? (hasNewUserMessage ? "AI生成剧情" : "需要新内容才能生成")
                    : (hasNewUserMessage ? "生成AI回复" : "需要新消息才能生成回复")
                }
              >
                <span className="btn-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                    <path d="M15.5 4.5l-3 3m3 3l-3-3"/>
                    <path d="M8.5 4.5l3 3m-3 3l3-3"/>
                  </svg>
                </span>
                <span className="btn-text">{isStoryMode ? "AI生成" : "AI回复"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 群成员管理模态框 */}
      {showMemberManager && chat.isGroup && (
        <GroupMemberManager
          isOpen={showMemberManager}
          onClose={() => setShowMemberManager(false)}
          chat={chat}
          onUpdateChat={onUpdateChat}
          availableContacts={availableContacts}
          personalSettings={personalSettings}
          onUpdatePersonalSettings={async (settings) => {
            try {
              // 更新个人设置到数据库
              await dataManager.initDB();
              await dataManager.savePersonalSettings(settings);
              setDbPersonalSettings(settings);
              console.log('个人设置已更新到数据库:', settings);
            } catch (error) {
              console.error('Failed to save personal settings to database:', error);
              // 如果数据库保存失败，回退到localStorage
              localStorage.setItem('personalSettings', JSON.stringify(settings));
            }
          }}
        />
      )}

      {/* 记忆管理模态框 */}
      {showMemoryManager && chat.isGroup && (
        <MemoryManager
          isOpen={showMemoryManager}
          onClose={() => setShowMemoryManager(false)}
          chat={chat}
          onUpdateChat={onUpdateChat}
          availableContacts={availableContacts}
        />
      )}

      {/* 单聊记忆管理模态框 */}
      {showSingleChatMemoryManager && !chat.isGroup && (
        <SingleChatMemoryManager
          isOpen={showSingleChatMemoryManager}
          onClose={() => setShowSingleChatMemoryManager(false)}
          chat={chat}
          onUpdateChat={onUpdateChat}
          availableContacts={allChats || availableContacts}
        />
      )}

      {/* 发送红包模态框 */}
      {showSendRedPacket && (
        <SendRedPacket
          isOpen={showSendRedPacket}
          onClose={() => setShowSendRedPacket(false)}
          onSend={handleSendRedPacket}
          currentBalance={currentBalance}
          recipientName={chat.name}
        />
      )}

      {/* 聊天状态管理器（仅在单聊中） */}
      {!chat.isGroup && (
        <ChatStatusManager
          chatId={chat.id}
          onStatusUpdate={setChatStatus}
        />
      )}

      {/* 世界书关联开关模态框 */}
      {showWorldBookAssociationSwitch && (
        <WorldBookAssociationSwitchModal
          isOpen={showWorldBookAssociationSwitch}
          onClose={() => setShowWorldBookAssociationSwitch(false)}
          linkedWorldBookIds={chat.settings.linkedWorldBookIds || []}
          onUpdateLinkedWorldBooks={handleWorldBookAssociationUpdate}
        />
      )}

      {/* 聊天背景设置模态框 */}
      {showBackgroundModal && (
        <ChatBackgroundModal
          isOpen={showBackgroundModal}
          onClose={() => setShowBackgroundModal(false)}
          currentBackground={chatBackground}

            currentOpacity={chatOpacity}
          onSave={async (background: string, opacity?: number) => {
            console.log('ChatInterface onSave被调用', { background, opacity });
            try {
              await dataManager.initDB();
              await dataManager.saveChatBackground(chat.id, background);
              
              // 同时保存到localStorage作为备份
              if (background) {
                localStorage.setItem(`chatBackground_${chat.id}`, background);
                localStorage.setItem(`chatOpacity_${chat.id}`, (opacity || 80).toString());
              } else {
                localStorage.removeItem(`chatBackground_${chat.id}`);
                localStorage.removeItem(`chatOpacity_${chat.id}`);
              }
              
              // 立即更新状态
              setChatBackground(background);
              setChatOpacity(opacity || 80);
              
              // 强制重新加载背景
              setTimeout(() => {
                const event = new CustomEvent('backgroundUpdated', { 
                  detail: { chatId: chat.id, background, opacity } 
                });
                window.dispatchEvent(event);
              }, 100);
              
              setShowBackgroundModal(false);
            } catch (error) {
              console.error('Failed to save chat background:', error);
              // 如果数据库保存失败，只保存到localStorage
              if (background) {
                localStorage.setItem(`chatBackground_${chat.id}`, background);
                localStorage.setItem(`chatOpacity_${chat.id}`, (opacity || 80).toString());
              } else {
                localStorage.removeItem(`chatBackground_${chat.id}`);
                localStorage.removeItem(`chatOpacity_${chat.id}`);
              }
              setChatBackground(background);
              setChatOpacity(opacity || 80);
              setShowBackgroundModal(false);
            }
          }}
          chatName={chat.name}
        />
      )}

      {/* 礼物记录 */}
      {showGiftHistory && (
        <GiftHistory
          isOpen={showGiftHistory}
          onClose={() => setShowGiftHistory(false)}
          chat={chat}
        />
      )}

      {/* 批量删除选择器 */}
      {showBatchDelete && (
        <BatchDeleteSelector
          messages={chat.messages}
          onBatchDelete={handleBatchDelete}
          onCancel={() => setShowBatchDelete(false)}
          isVisible={showBatchDelete}
        />
      )}

    </div>
    </ChatBackgroundManager>
  );
} 