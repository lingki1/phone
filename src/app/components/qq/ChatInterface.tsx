'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Message, ChatItem, GroupMember, QuoteMessage } from '../../types/chat';
import { dataManager } from '../../utils/dataManager';
import { WorldBookInjector } from '../../utils/WorldBookInjector';
import GroupMemberManager from './GroupMemberManager';
import MemoryManager from './memory/MemoryManager';
import SingleChatMemoryManager from './memory/SingleChatMemoryManager';
import SendRedPacket from './money/SendRedPacket';
import RedPacketMessage from './money/RedPacketMessage';
import AiRedPacketResponse from './money/AiRedPacketResponse';
import { ChatStatusManager, ChatStatusDisplay, ChatStatus, injectStatusPrompt } from './chatstatus';
import { ChatBackgroundManager, ChatBackgroundModal } from './chatbackground';
import { useAiPendingState, AiPendingIndicator } from '../async';
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
  const [chatAnimation, setChatAnimation] = useState<string>('none');
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  
  // 使用异步AI状态管理
  const { isPending, startAiTask, endAiTask } = useAiPendingState(chat.id);
  
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
    };
  }, [chat.id]);
  
  // 分页加载相关状态
  const MESSAGE_RENDER_WINDOW = 30; // 每次加载30条消息
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [userScrolling, setUserScrolling] = useState(false); // 新增：检测用户是否正在手动滚动
  const lastMessageCountRef = useRef(0); // 使用ref替代state，避免循环依赖
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自动调整输入框高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 重置高度以获取正确的 scrollHeight
    textarea.style.height = 'auto';
    
    // 计算新高度，最小高度为一行，最大高度为5行
    const minHeight = 40; // 一行的高度
    const maxHeight = 120; // 5行的高度
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  };



  // 滚动到底部 - 采用V0.03的设计方案
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // 加载更多历史消息
  const loadMoreMessages = useCallback(() => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    setIsLoadingHistory(true); // 标记正在加载历史消息
    const currentFirstMessageIndex = chat.messages.findIndex(msg => msg.id === displayedMessages[0]?.id);
    
    if (currentFirstMessageIndex === -1) {
      setIsLoadingMore(false);
      setIsLoadingHistory(false);
      return;
    }
    
    const startIndex = Math.max(0, currentFirstMessageIndex - MESSAGE_RENDER_WINDOW);
    const endIndex = currentFirstMessageIndex;
    const messagesToPrepend = chat.messages.slice(startIndex, endIndex);
    
    if (messagesToPrepend.length > 0) {
      const oldScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
      
      setDisplayedMessages(prev => {
        const existingIds = new Set(prev.map(msg => msg.id));
        const newMessages = messagesToPrepend.filter(msg => !existingIds.has(msg.id));
        return [...newMessages, ...prev];
      });
      
      // 更新是否有更多消息
      setHasMoreMessages(startIndex > 0);
      
      // 保持滚动位置
      setTimeout(() => {
        const newScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
        const scrollDiff = newScrollHeight - oldScrollHeight;
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = scrollDiff;
        }
        setIsLoadingMore(false);
        setIsLoadingHistory(false); // 标记历史消息加载完成
      }, 50);
    } else {
      setIsLoadingMore(false);
      setIsLoadingHistory(false);
    }
  }, [isLoadingMore, hasMoreMessages, chat.messages, displayedMessages]);

  // 初始化显示的消息 - 打开聊天默认最新消息处
  useEffect(() => {
    if (chat.messages.length > 0) {
      const initialMessages = chat.messages.slice(-MESSAGE_RENDER_WINDOW);
      setDisplayedMessages(initialMessages);
      setHasMoreMessages(chat.messages.length > MESSAGE_RENDER_WINDOW);
      lastMessageCountRef.current = chat.messages.length; // 设置初始消息数量
      setIsInitialized(true);
    } else {
      setDisplayedMessages([]);
      setHasMoreMessages(false);
              lastMessageCountRef.current = 0; // 设置初始消息数量
      setIsInitialized(true);
    }
  }, [chat.messages]);

  // 初始化完成后滚动到最新消息处
  useEffect(() => {
    if (isInitialized && displayedMessages.length > 0 && !isLoadingHistory && !userScrolling) {
      // 只在初始化时滚动，避免加载历史消息时滚动
      const isInitialLoad = displayedMessages.length <= MESSAGE_RENDER_WINDOW;
      if (isInitialLoad) {
        // 采用V0.03的设计方案：延迟滚动确保DOM渲染完成
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }
  }, [isInitialized, displayedMessages, isLoadingHistory, userScrolling]);

  // 标记消息为已读
  useEffect(() => {
    if (isInitialized && displayedMessages.length > 0) {
      const markMessagesAsRead = async () => {
        try {
          // 获取当前显示的最新消息时间戳
          const latestMessageTimestamp = Math.max(...displayedMessages.map(msg => msg.timestamp));
          
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
  }, [isInitialized, displayedMessages, chat.messages, onUpdateChat, chat]);

    // 新消息发送显示最新消息处
  useEffect(() => {
    // 只有在不是加载历史消息且用户没有手动滚动时才处理新消息
    if (isInitialized && chat.messages.length > 0 && !isLoadingHistory && !userScrolling) {
      // 检查是否有真正的新消息（消息数量增加）
      if (chat.messages.length > lastMessageCountRef.current) {
        // 更新显示的消息，添加新消息
        setDisplayedMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id));
          const newMessages = chat.messages.filter(msg => !existingIds.has(msg.id));
          return [...prev, ...newMessages];
        });
        
        // 新消息发送后立即滚动到最新消息处
        setTimeout(() => {
          scrollToBottom();
        }, 0);
        
        // 更新消息数量记录
        lastMessageCountRef.current = chat.messages.length;
      }
    }
  }, [chat.messages, isInitialized, isLoadingHistory, userScrolling]);

  // 监听滚动事件，向上滑动自动加载更多的30条
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // 标记用户正在滚动
      setUserScrolling(true);
      
      // 清除之前的定时器
      clearTimeout(scrollTimeout);
      
      // 当滚动到顶部附近时（距离顶部100px内），自动加载更多消息
      if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
        loadMoreMessages();
      }
      
      // 滚动停止后1秒，重置用户滚动状态
      scrollTimeout = setTimeout(() => {
        setUserScrolling(false);
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);



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

  // 加载聊天背景
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
    };
    
    loadBackground();
  }, [chat.id]);

  // 监听API配置变更
  useEffect(() => {
    const handleApiConfigChange = async () => {
      try {
        await dataManager.initDB();
        const newApiConfig = await dataManager.getApiConfig();
        console.log('ChatInterface - 监听到API配置变更，重新加载:', {
          proxyUrl: newApiConfig.proxyUrl,
          apiKey: newApiConfig.apiKey ? '已设置' : '未设置',
          model: newApiConfig.model
        });
        // 注意：这里我们不能直接更新apiConfig，因为它是从props传入的
        // 但是我们可以通过触发父组件的更新来间接更新
        // 这里主要是为了调试和日志记录
      } catch (error) {
        console.error('Failed to reload API config in ChatInterface:', error);
      }
    };

    window.addEventListener('apiConfigChanged', handleApiConfigChange);
    
    return () => {
      window.removeEventListener('apiConfigChanged', handleApiConfigChange);
    };
  }, []);

  // 初始化输入框高度
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  // 处理@提及功能
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMessage(value);
    
    // 自动调整输入框高度
    adjustTextareaHeight();
    
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
  };

  // 选择@提及的成员
  const selectMention = (member: GroupMember) => {
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
  };

  // 过滤可@的成员
  const getFilteredMembers = () => {
    if (!chat.members) return [];
    return chat.members.filter(member => 
      member.groupNickname.toLowerCase().includes(mentionFilter.toLowerCase())
    );
  };

  // 引用消息
  const handleQuoteMessage = (msg: Message) => {
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
  };

  // 取消引用
  const cancelQuote = () => {
    setQuotedMessage(undefined);
  };

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

      // 创建红包消息
      const redPacketMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `发送了一个红包`,
        timestamp: Date.now(),
        senderName: chat.isGroup ? (chat.settings.myNickname || '我') : undefined,
        senderAvatar: chat.isGroup ? chat.settings.myAvatar : undefined,
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
  const handleClaimRedPacket = async (redPacketId: string) => {
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
  };





  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: Date.now(),
      senderName: chat.isGroup ? (chat.settings.myNickname || '我') : undefined,
      senderAvatar: chat.isGroup ? chat.settings.myAvatar : undefined,
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

    // 重置输入框高度
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);

    // 触发AI回复（异步执行，不等待完成）
    startAiTask(); // 开始AI任务
    triggerAiResponse(updatedChat);
  };

  // 触发AI回复的核心函数
  const triggerAiResponse = async (updatedChat: ChatItem) => {
    // 优先使用聊天设置中的API配置，如果没有则使用传入的apiConfig
    const effectiveApiConfig = {
      proxyUrl: updatedChat.settings.proxyUrl || apiConfig.proxyUrl,
      apiKey: updatedChat.settings.apiKey || apiConfig.apiKey,
      model: updatedChat.settings.model || apiConfig.model
    };

    // 添加调试信息
    console.log('ChatInterface - API配置检查:', {
      chatSettings: {
        proxyUrl: updatedChat.settings.proxyUrl,
        apiKey: updatedChat.settings.apiKey ? '已设置' : '未设置',
        model: updatedChat.settings.model
      },
      fallbackConfig: {
        proxyUrl: apiConfig.proxyUrl,
        apiKey: apiConfig.apiKey ? '已设置' : '未设置',
        model: apiConfig.model
      },
      effectiveConfig: {
        proxyUrl: effectiveApiConfig.proxyUrl,
        apiKey: effectiveApiConfig.apiKey ? '已设置' : '未设置',
        model: effectiveApiConfig.model,
        hasAllConfig: !!(effectiveApiConfig.proxyUrl && effectiveApiConfig.apiKey && effectiveApiConfig.model)
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
        senderAvatar: '/avatars/default-avatar.svg'
      };

      const chatWithMessage = {
        ...updatedChat,
        messages: [...updatedChat.messages, apiConfigMessage],
        lastMessage: apiConfigMessage.content,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateChat(chatWithMessage);
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
      const systemPrompt = await buildSystemPrompt(updatedChat);
      const messagesPayload = buildMessagesPayload(updatedChat);

      const response = await fetch(`${effectiveApiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: effectiveApiConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messagesPayload
          ],
          temperature: currentPreset?.temperature || 0.8,
          max_tokens: currentPreset?.maxTokens || 2000,
          top_p: currentPreset?.topP || 0.8,
          ...(currentPreset?.topK && { top_k: currentPreset.topK }),
          frequency_penalty: currentPreset?.frequencyPenalty || 0.0,
          presence_penalty: currentPreset?.presencePenalty || 0.0,
          ...(currentPreset?.stopSequences && { stop: currentPreset.stopSequences }),
          ...(currentPreset?.logitBias && { logit_bias: currentPreset.logitBias }),
          ...(currentPreset?.responseFormat && { response_format: { type: currentPreset.responseFormat } }),
          ...(currentPreset?.seed && { seed: currentPreset.seed }),
          ...(currentPreset?.user && { user: currentPreset.user })
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
      const messagesArray = parseAiResponse(aiResponseContent);
      
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
        const aiMessage = await createAiMessage(msgData, currentChat, messageTimestamp++);
        if (aiMessage) {
          // 更新聊天记录
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
        senderAvatar: '/avatars/default-avatar.svg'
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
  };

  // 检查是否需要触发状态更新
  const shouldTriggerStatusUpdate = () => {
    const now = Date.now();
    const lastUpdate = chatStatus.lastUpdate;
    const timeDiff = now - lastUpdate;
    
    // 如果距离上次状态更新超过30分钟，或者这是第一次对话，则触发状态更新
    return timeDiff > 30 * 60 * 1000 || chat.messages.length <= 1;
  };

  // 构建系统提示词
  const buildSystemPrompt = async (chat: ChatItem): Promise<string> => {
    const now = new Date();
    const currentTime = now.toLocaleString('zh-CN', { dateStyle: 'full', timeStyle: 'short' });
    // 优先使用数据库中的个人信息，后备使用传入的personalSettings
    const myNickname = dbPersonalSettings?.userNickname || personalSettings?.userNickname || chat.settings.myNickname || '我';
    const myPersona = dbPersonalSettings?.userBio || personalSettings?.userBio || chat.settings.myPersona || '用户';

    let basePrompt: string;

    if (chat.isGroup && chat.members) {
      // 群聊系统提示词
      const membersList = chat.members.map(m => `- **${m.originalName}**: ${m.persona}`).join('\n');
      
      // 构建单聊记忆信息
      const memoryInfo = chat.members
        .filter(m => m.id !== 'me' && m.singleChatMemory && m.singleChatMemory.length > 0)
        .map(m => {
          const memoryCount = m.singleChatMemory?.length || 0;
          const recentMessages = m.singleChatMemory?.slice(-5).map(msg => 
            `${msg.role === 'user' ? myNickname : m.originalName}: ${msg.content}`
          ).join('\n') || '';
          
          return `## ${m.originalName} 与 ${myNickname} 的单聊记忆 (${memoryCount} 条记录)
最近5条对话：
${recentMessages}`;
        })
        .join('\n\n');
      
      basePrompt = `你是一个群聊AI，负责扮演【除了用户以外】的所有角色。

# 核心规则
1. **【身份铁律】**: 用户的身份是【${myNickname}】。你【绝对、永远、在任何情况下都不能】生成name字段为"${myNickname}"或"${chat.name}"的消息。
2. **【输出格式】**: 你的回复【必须】是一个JSON数组格式的字符串。数组中的【每一个元素都必须是一个带有"type"和"name"字段的JSON对象】。
3. **角色扮演**: 严格遵守下方"群成员列表及人设"中的每一个角色的设定。
4. **对话节奏**: 模拟真人的聊天习惯，你可以一次性生成多条短消息。每次要回复至少2-3条消息，不能超过4条消息，指令消息不算！！！
5. **禁止出戏**: 绝不能透露你是AI、模型，或提及"扮演"、"生成"等词语。
6. **情景感知**: 注意当前时间是 ${currentTime},但是不能重复提及时间概念。
7. **记忆继承**: 每个角色都拥有与用户的单聊记忆，在群聊中要体现这些记忆和关系。

## 你可以使用的操作指令:
- **发送文本**: {"type": "text", "name": "角色名", "message": "文本内容"}
- **发送表情**: {"type": "sticker", "name": "角色名", "meaning": "表情含义"} (注意：不允许使用url字段，不能发送链接图片)
- **发送图片**: {"type": "ai_image", "name": "角色名", "description": "图片描述"}
- **发送语音**: {"type": "voice_message", "name": "角色名", "content": "语音内容"}
- **拍一拍用户**: {"type": "pat_user", "name": "角色名", "suffix": "后缀"}
- **发送红包**: {"type": "send_red_packet", "name": "角色名", "amount": 金额数字, "message": "祝福语"}
- **请求红包**: {"type": "request_red_packet", "name": "角色名", "message": "请求消息"}
- **接收红包**: {"type": "accept_red_packet", "name": "角色名", "red_packet_id": "红包ID", "message": "感谢消息"}
- **拒绝红包**: {"type": "decline_red_packet", "name": "角色名", "red_packet_id": "红包ID", "message": "拒绝理由"}

# 红包处理规则：
- 当用户发送红包时，你需要根据角色性格和当前情境判断是否接收
- 如果接收红包，使用accept_red_packet命令，并表达感谢
- 如果拒绝红包，使用decline_red_packet命令，并说明理由
- **重要**：红包ID在对话历史中以"红包ID: redpacket_时间戳"的格式提供，你必须准确复制这个ID
- 你可以根据红包金额、祝福语、当前关系等因素做出判断
- 示例：如果看到"红包ID: redpacket_1703123456789"，则使用"redpacket_1703123456789"作为red_packet_id
- **禁止调试信息**：不要在消息中包含"测试"、"调试"、"功能"等调试相关词汇，保持自然的对话风格

# 群成员列表及人设
${membersList}

# 用户的角色
- **${myNickname}**: ${myPersona}

${memoryInfo ? `# 单聊记忆信息
${memoryInfo}` : ''}

现在，请根据以上规则、对话历史和单聊记忆，继续这场群聊。每个角色都应该基于与用户的单聊记忆来表现更真实的关系和互动。`;
    } else {
      // 单聊系统提示词
      
      // 构建群聊记忆信息
      let groupMemoryInfo = '';
      if (chat.settings.linkedGroupChatIds && chat.settings.linkedGroupChatIds.length > 0) {
        const groupMemoryPromises = chat.settings.linkedGroupChatIds.map(async (groupChatId) => {
          // 优先使用 allChats，后备使用 availableContacts
          const allChatsData = allChats || availableContacts;
          const groupChat = allChatsData.find(contact => contact.id === groupChatId);
          if (!groupChat || !groupChat.messages) return null;
          
          // 获取群聊中所有人的消息
          const recentMessages = groupChat.messages.slice(-5).map(msg => 
            `${msg.role === 'user' ? myNickname : msg.senderName || chat.name}: ${msg.content}`
          ).join('\n');
          
          return `## ${groupChat.name} 群聊记忆 (${groupChat.messages.length} 条记录)
最近5条对话记录：
${recentMessages}

注意：这些是你在群聊中的表现，在单聊中请保持一致的个性和关系。`;
        });
        
        const groupMemories = await Promise.all(groupMemoryPromises);
        const validMemories = groupMemories.filter(memory => memory !== null);
        
        // 添加调试信息
        console.log('单聊群聊记忆构建:', {
          linkedGroupChatIds: chat.settings.linkedGroupChatIds,
          allChatsCount: allChats?.length || 0,
          availableContactsCount: availableContacts?.length || 0,
          foundGroupChats: validMemories.length,
          groupMemoryInfo: validMemories.length > 0 ? '已构建' : '无群聊记忆'
        });
        
        if (validMemories.length > 0) {
          groupMemoryInfo = `\n\n# 群聊记忆信息
${validMemories.join('\n\n')}`;
        }
      }
      
      basePrompt = `你现在扮演一个名为"${chat.name}"的角色。

# 你的角色设定：
${chat.settings.aiPersona}

# 你的任务与规则：
1. **【输出格式】**: 你的回复【必须】是一个JSON数组格式的字符串。数组中的【每一个元素都必须是一个带有type字段的JSON对象】。
2. **对话节奏**: 模拟真人的聊天习惯，你可以一次性生成多条短消息。每次要回复至少3-8条消息！！！
3. **情景感知**: 你需要感知当前的时间(${currentTime})，但是不能重复提及时间概念。
4. **禁止出戏**: 绝不能透露你是AI、模型，或提及"扮演"、"生成"等词语。
5. **群聊记忆**: 你拥有在群聊中与用户的互动记忆，在单聊中要体现这些记忆和关系。请参考下方的"群聊记忆信息"部分，了解你在群聊中的表现和与用户的关系。
6. **状态实时性**: 每次对话都应该根据当前时间、对话内容和情境实时更新你的状态，让对话更有真实感。

# 你可以使用的操作指令:
- **发送文本**: {"type": "text", "content": "文本内容"}
- **发送表情**: {"type": "sticker", "meaning": "表情含义"} (注意：不允许使用url字段，不能发送链接图片)
- **发送图片**: {"type": "ai_image", "description": "图片描述"}
- **发送语音**: {"type": "voice_message", "content": "语音内容"}
- **拍一拍用户**: {"type": "pat_user", "suffix": "后缀"}
- **发送红包**: {"type": "send_red_packet", "amount": 金额数字, "message": "祝福语"}
- **请求红包**: {"type": "request_red_packet", "message": "请求消息"}
- **接收红包**: {"type": "accept_red_packet", "red_packet_id": "红包ID", "message": "感谢消息"}
- **拒绝红包**: {"type": "decline_red_packet", "red_packet_id": "红包ID", "message": "拒绝理由"}
- **更新状态**: {"type": "status_update", "mood": "新心情", "location": "新位置", "outfit": "新穿着"}

# 红包处理规则：
- 当用户发送红包时，你需要根据角色性格和当前情境判断是否接收
- 如果接收红包，使用accept_red_packet命令，并表达感谢
- 如果拒绝红包，使用decline_red_packet命令，并说明理由
- **重要**：红包ID在对话历史中以"红包ID: redpacket_时间戳"的格式提供，你必须准确复制这个ID
- 你可以根据红包金额、祝福语、当前关系等因素做出判断
- 示例：如果看到"红包ID: redpacket_1703123456789"，则使用"redpacket_1703123456789"作为red_packet_id
- **禁止调试信息**：不要在消息中包含"测试"、"调试"、"功能"等调试相关词汇，保持自然的对话风格

# 对话者的角色设定：
${myPersona}${groupMemoryInfo}

现在，请根据以上规则、对话历史和群聊记忆，继续进行对话。`;
    }

    // 注入世界书内容
    let finalPrompt = await WorldBookInjector.injectWorldBooks(
      chat.id,
      basePrompt,
      chat.settings.linkedWorldBookIds || []
    );

    // 注入状态提示词（仅在单聊中）
    if (!chat.isGroup) {
      finalPrompt = injectStatusPrompt(finalPrompt, chatStatus);
      
      // 如果需要触发状态更新，添加强制更新指令
      if (shouldTriggerStatusUpdate()) {
        finalPrompt += `

## 重要：状态更新要求
由于距离上次状态更新已经较长时间，或者这是我们的第一次对话，请务必在回复中包含状态更新指令。
请根据当前时间和情境，更新你的状态信息，让对话更加真实自然。

示例回复格式：
[
  {"type": "status_update", "mood": "当前心情", "location": "当前位置", "outfit": "当前穿着"},
  {"type": "text", "content": "你的回复内容"}
]`;
      }
    }

    return finalPrompt;
  };

  // 构建消息载荷
  const buildMessagesPayload = (chat: ChatItem) => {
    // 从全局设置获取最大记忆数量，如果没有设置则使用默认值
    const globalSettings = localStorage.getItem('globalSettings');
    const maxMemory = globalSettings ? JSON.parse(globalSettings).maxMemory || 20 : 20;
    const historySlice = chat.messages.slice(-maxMemory);
    // 优先使用数据库中的个人信息，后备使用传入的personalSettings
    const myNickname = dbPersonalSettings?.userNickname || personalSettings?.userNickname || chat.settings.myNickname || '我';

    return historySlice.map(msg => {
      const sender = msg.role === 'user' ? myNickname : msg.senderName;
      const prefix = `${sender} (Timestamp: ${msg.timestamp}): `;
      
      let content;
      if (msg.type === 'ai_image') {
        content = `[${sender} 发送了一张图片]`;
      } else if (msg.type === 'voice_message') {
        content = `[${sender} 发送了一条语音，内容是：'${msg.content}']`;
      } else if (msg.meaning) {
        content = `${sender}: [发送了一个表情，意思是: '${msg.meaning}']`;
      } else if (msg.type === 'red_packet_send' && msg.redPacketData) {
        // 红包发送消息，包含红包ID和详细信息
        const redPacket = msg.redPacketData;
        let status = '待处理';
        if (redPacket.status === 'accepted') {
          status = '已接收';
        } else if (redPacket.status === 'rejected') {
          status = '已拒绝';
        } else if (redPacket.isClaimed) {
          status = '已被领取';
        }
        content = `${prefix}发送了一个红包 [红包ID: ${redPacket.id}, 金额: ¥${redPacket.amount}, 祝福语: "${redPacket.message}", 状态: ${status}]`;
      } else if (msg.type === 'red_packet_receive' && msg.redPacketData) {
        // AI发送给用户的红包
        content = `${prefix}${msg.content} [金额: ¥${msg.redPacketData.amount}]`;
      } else if (msg.type === 'red_packet_request' && msg.redPacketData) {
        // AI请求红包
        content = `${prefix}${msg.content} [${msg.redPacketData.message}]`;
      } else {
        content = `${prefix}${msg.content}`;
      }
      
      return { role: 'user', content };
    }).filter(Boolean);
  };

  // 解析AI回复（参考V0.03文件的强大解析逻辑）
  const parseAiResponse = (content: string) => {
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
  const createAiMessage = async (msgData: Record<string, unknown>, chat: ChatItem, timestamp: number): Promise<Message | null> => {
    // 根据消息类型处理内容
    let content = '';
    let type: Message['type'] = 'text';
    let meaning: string | undefined;
    let url: string | undefined;

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
            senderAvatar: chat.isGroup ? chat.members?.find(m => m.originalName === String(msgData.name))?.avatar : chat.settings.aiAvatar,
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
          senderAvatar: chat.isGroup ? chat.members?.find(m => m.originalName === String(msgData.name))?.avatar : chat.settings.aiAvatar,
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
      senderName: String(msgData.name || chat.name),
      senderAvatar: chat.isGroup ? chat.members?.find(m => m.originalName === String(msgData.name))?.avatar : chat.settings.aiAvatar,
      type,
      meaning,
      url,
      isRead: false // AI消息默认为未读
    };

    return aiMessage;
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 编辑用户消息
  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessage({ id: messageId, content: currentContent });
  };

  // 保存编辑的消息
  const handleSaveEdit = () => {
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
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  // 删除消息
  const handleDeleteMessage = (messageId: string) => {
    if (confirm('确定要删除这条消息吗？')) {
      const updatedChat = {
        ...chat,
        messages: chat.messages.filter(msg => msg.id !== messageId)
      };
      onUpdateChat(updatedChat);
    }
  };

  // 重新生成AI回复
  const handleRegenerateAI = async (messageId: string) => {
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
  };



  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 渲染消息内容
  const renderMessageContent = (msg: Message) => {
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
          <div className="image-message">
            <div className="image-placeholder">
              📷 {msg.content}
            </div>
          </div>
        );
      case 'voice_message':
        return (
          <div className="voice-message">
            🎤 {msg.content}
          </div>
        );
      case 'red_packet_send':
      case 'red_packet_receive':
      case 'red_packet_request':
        return (
          <RedPacketMessage
            message={msg}
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
  };

  return (
    <ChatBackgroundManager
      chatId={chat.id}
      onBackgroundChange={(background, animation) => {
        setChatBackground(background);
        setChatAnimation(animation || 'none');
      }}
    >
      <div className="chat-interface">
      {/* 顶部导航栏 */}
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>‹</button>
        <div className="chat-info">
          <Image 
            src={chat.avatar} 
            alt={chat.name}
            width={32}
            height={32}
            className="chat-avatar"
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
          {/* 后台AI回复指示器 */}
          <AiPendingIndicator 
            isPending={isPending}
            size="small"
            variant="dots"
            aiName={chat.name}
          />
          <button 
            className="action-btn"
            onClick={() => setShowBackgroundModal(true)}
            title="设置聊天背景"
          >
            🖼️
          </button>
          {chat.isGroup ? (
            <>
              <button 
                className="action-btn"
                onClick={() => setShowMemoryManager(true)}
                title="记忆管理"
              >
                📋
              </button>
              <button 
                className="action-btn"
                onClick={() => setShowMemberManager(true)}
                title="群成员管理"
              >
                👥
              </button>
            </>
          ) : (
            <button 
              className="action-btn"
              onClick={() => setShowSingleChatMemoryManager(true)}
              title="群聊记忆管理"
            >
              📋
            </button>
          )}
        </div>
      </div>



      {/* 消息列表 */}
      <div className="messages-container" ref={messagesContainerRef}>
        {/* 加载更多按钮 */}
        {hasMoreMessages && (
          <div className="load-more-container">
            <button 
              className={`load-more-btn ${isLoadingMore ? 'loading' : ''}`}
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? '加载中...' : '加载更早的记录'}
            </button>
          </div>
        )}
        
        {displayedMessages.length === 0 ? (
          <div className="empty-chat">
            <p>开始和 {chat.name} 聊天吧！</p>
          </div>
        ) : (
          displayedMessages.map((msg, index) => {
            // 获取发送者信息
            const getSenderInfo = () => {
              if (msg.role === 'user') {
                return {
                  name: dbPersonalSettings?.userNickname || personalSettings?.userNickname || chat.settings.myNickname || '我',
                  avatar: dbPersonalSettings?.userAvatar || personalSettings?.userAvatar || chat.settings.myAvatar || '/avatars/user-avatar.svg'
                };
              } else {
                // AI消息，从群成员中查找对应的成员信息
                if (chat.isGroup && chat.members && msg.senderName) {
                  const member = chat.members.find(m => m.originalName === msg.senderName);
                  if (member) {
                    return {
                      name: member.groupNickname,
                      avatar: member.avatar
                    };
                  }
                }
                return {
                  name: msg.senderName || chat.name,
                  avatar: msg.senderAvatar || chat.avatar
                };
              }
            };

            const senderInfo = getSenderInfo();
            
            // 检查是否是连续消息（同一发送者的连续消息）
            // 只有在时间间隔很短（30秒内）且内容类型相似时才认为是连续消息
            const isConsecutiveMessage = index > 0 && 
              displayedMessages[index - 1].senderName === msg.senderName &&
              displayedMessages[index - 1].role === msg.role &&
              Math.abs(msg.timestamp - displayedMessages[index - 1].timestamp) < 30000; // 30秒内

            return (
              <div 
                key={msg.id} 
                className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'} ${chat.isGroup ? 'group-message' : ''} ${isConsecutiveMessage ? 'consecutive' : ''}`}
                onDoubleClick={() => handleQuoteMessage(msg)}
              >
                <div className="message-avatar">
                  <Image 
                    src={senderInfo.avatar}
                    alt={senderInfo.name}
                    width={36}
                    height={36}
                    className="avatar-image"
                  />
                </div>
                <div className="message-content">
                  {chat.isGroup && (
                    <div className="message-sender">{senderInfo.name}</div>
                  )}
                  {msg.quote && (
                    <div className="quoted-message">
                      <div className="quote-header">
                        <span className="quote-sender">{msg.quote.senderName}</span>
                        <span className="quote-time">{formatTime(msg.quote.timestamp)}</span>
                      </div>
                      <div className="quote-content">{msg.quote.content}</div>
                    </div>
                  )}
                  
                  {/* 编辑状态 */}
                  {editingMessage?.id === msg.id ? (
                    <div className="message-edit-container">
                      <textarea
                        value={editingMessage.content}
                        onChange={(e) => setEditingMessage({...editingMessage, content: e.target.value})}
                        className="message-edit-input"
                        autoFocus
                      />
                      <div className="message-edit-actions">
                        <button onClick={handleSaveEdit} className="edit-save-btn">✅ 保存</button>
                        <button onClick={handleCancelEdit} className="edit-cancel-btn">❌ 取消</button>
                      </div>
                    </div>
                  ) : (
                    <div className="message-bubble">
                      {renderMessageContent(msg)}
                    </div>
                  )}
                  
                  <div className="message-time">
                    {formatTime(msg.timestamp)}
                                      {/* 消息操作图标 */}
                  <div className="message-actions">
                    {msg.role === 'user' && (
                      <button 
                        className="message-action-btn edit-btn"
                        onClick={() => handleEditMessage(msg.id, msg.content)}
                        title="编辑消息"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                    {msg.role === 'assistant' && (
                      <button 
                        className="message-action-btn regenerate-btn"
                        onClick={() => handleRegenerateAI(msg.id)}
                        title="重新生成"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                          <path d="M21 3v5h-5"/>
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                          <path d="M3 21v-5h5"/>
                        </svg>
                      </button>
                    )}
                    <button 
                      className="message-action-btn delete-btn"
                      onClick={() => handleDeleteMessage(msg.id)}
                      title="删除消息"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* AI正在输入指示器 */}
        {(isLoading || isPending) && (
          <div className={`message ai-message ${chat.isGroup ? 'group-message' : ''}`}>
            <div className="message-avatar">
              <Image 
                src={currentAiUser?.avatar || chat.avatar}
                alt={currentAiUser?.name || chat.name}
                width={36}
                height={36}
                className="avatar-image"
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
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
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
            {getFilteredMembers().map(member => (
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
        
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isPending ? "AI正在回复中，请稍候..." : (chat.isGroup ? "输入消息，@可提及群成员..." : "输入消息...")}
            rows={1}
            disabled={isLoading || isPending}
            style={{
              resize: 'none',
              overflow: 'hidden',
              minHeight: '40px',
              maxHeight: '120px'
            }}
          />
          <button 
            className="red-packet-btn"
            onClick={() => setShowSendRedPacket(true)}
            disabled={isLoading || isPending}
            title="发送红包"
          >
            🧧
          </button>
          <button 
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading || isPending}
          >
            发送
          </button>
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

      {/* 聊天背景设置模态框 */}
      {showBackgroundModal && (
        <ChatBackgroundModal
          isOpen={showBackgroundModal}
          onClose={() => setShowBackgroundModal(false)}
          currentBackground={chatBackground}
          currentAnimation={chatAnimation}
          onSave={async (background: string, animation: string) => {
            try {
              await dataManager.initDB();
              await dataManager.saveChatBackground(chat.id, background);
              
              // 同时保存到localStorage作为备份
              if (background) {
                localStorage.setItem(`chatBackground_${chat.id}`, background);
                localStorage.setItem(`chatAnimation_${chat.id}`, animation);
              } else {
                localStorage.removeItem(`chatBackground_${chat.id}`);
                localStorage.removeItem(`chatAnimation_${chat.id}`);
              }
              
              // 立即更新状态
              setChatBackground(background);
              setChatAnimation(animation);
              
              // 强制重新加载背景
              setTimeout(() => {
                const event = new CustomEvent('backgroundUpdated', { 
                  detail: { chatId: chat.id, background, animation } 
                });
                window.dispatchEvent(event);
              }, 100);
              
              setShowBackgroundModal(false);
            } catch (error) {
              console.error('Failed to save chat background:', error);
              // 如果数据库保存失败，只保存到localStorage
              if (background) {
                localStorage.setItem(`chatBackground_${chat.id}`, background);
                localStorage.setItem(`chatAnimation_${chat.id}`, animation);
              } else {
                localStorage.removeItem(`chatBackground_${chat.id}`);
                localStorage.removeItem(`chatAnimation_${chat.id}`);
              }
              setChatBackground(background);
              setChatAnimation(animation);
              setShowBackgroundModal(false);
            }
          }}
          chatName={chat.name}
        />
      )}

    </div>
    </ChatBackgroundManager>
  );
} 