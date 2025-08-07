'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [showWorldBookAssociationSwitch, setShowWorldBookAssociationSwitch] = useState(false);
  
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
      // 清理AI任务状态，防止组件卸载时状态残留
      setIsLoading(false);
      setCurrentAiUser(null);
      endAiTask();
    };
  }, [chat.id, endAiTask]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

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

  // 检测用户是否在查看历史消息
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px容差
    
    setShouldAutoScroll(isAtBottom);
  };

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
    if (shouldAutoScroll) {
      // 新消息到达时使用平滑滚动
      scrollToBottom(true);
    }
  }, [chat.messages, shouldAutoScroll]);

  // 当用户发送消息时，强制滚动到底部
  useEffect(() => {
    if (chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage.role === 'user') {
        forceScrollToBottom();
      }
    }
  }, [chat.messages, forceScrollToBottom]);

  // 当AI开始回复时，自动滚动到底部
  useEffect(() => {
    if (isLoading || isPending) {
      forceScrollToBottom();
    }
  }, [isLoading, isPending, forceScrollToBottom]);


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

  // 标记消息为已读
  useEffect(() => {
    if (chat.messages.length > 0) {
      const markMessagesAsRead = async () => {
        try {
          // 获取当前显示的最新消息时间戳
          const latestMessageTimestamp = Math.max(...chat.messages.map(msg => msg.timestamp));
          
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
  }, [chat.messages, onUpdateChat, chat]);

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
        personalSettings
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

  // 处理图片消息点击
  const handleImageMessageClick = (content: string, senderName?: string) => {
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
  };

  // 处理世界书关联更新
  const handleWorldBookAssociationUpdate = (worldBookIds: string[]) => {
    const updatedChat = {
      ...chat,
      settings: {
        ...chat.settings,
        linkedWorldBookIds: worldBookIds
      }
    };
    onUpdateChat(updatedChat);
  };

  // 处理语音消息点击
  const handleVoiceMessageClick = (content: string, senderName?: string) => {
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
          <button 
            className="action-btn"
            onClick={() => setShowWorldBookAssociationSwitch(true)}
            title="世界书关联管理"
          >
            📚
          </button>
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
      <div className="messages-container" ref={messagesContainerRef} onScroll={handleScroll}>
        {chat.messages.length === 0 ? (
          <div className="empty-chat">
            <p>开始和 {chat.name} 聊天吧！</p>
          </div>
        ) : (
          <>
            {!shouldAutoScroll && (
              <button 
                className="scroll-to-bottom-btn"
                onClick={() => scrollToBottom(true)}
                title="滚动到最新消息"
              >
                ↓
              </button>
            )}
            {chat.messages.map((msg, index) => {
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
              chat.messages[index - 1].senderName === msg.senderName &&
              chat.messages[index - 1].role === msg.role &&
              Math.abs(msg.timestamp - chat.messages[index - 1].timestamp) < 30000; // 30秒内

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
          })}
        </>
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