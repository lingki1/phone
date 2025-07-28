'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Message, ChatItem, GroupMember, QuoteMessage } from '../../types/chat';
import GroupMemberManager from './GroupMemberManager';
import './ChatInterface.css';

interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
}

interface ChatInterfaceProps {
  chat: ChatItem;
  apiConfig: ApiConfig;
  onBack: () => void;
  onUpdateChat: (chat: ChatItem) => void;
  availableContacts: ChatItem[];
}

export default function ChatInterface({ 
  chat, 
  apiConfig, 
  onBack, 
  onUpdateChat,
  availableContacts
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<QuoteMessage | undefined>(undefined);
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  // 处理@提及功能
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMessage(value);
    
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
    textareaRef.current?.focus();
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

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: Date.now(),
      senderName: chat.isGroup ? (chat.settings.myNickname || '我') : undefined,
      senderAvatar: chat.isGroup ? chat.settings.myAvatar : undefined,
      quote: quotedMessage
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

    // 触发AI回复
    await triggerAiResponse(updatedChat, userMessage);
  };

  // 触发AI回复的核心函数
  const triggerAiResponse = async (updatedChat: ChatItem, userMessage: Message) => {
    if (!apiConfig.proxyUrl || !apiConfig.apiKey || !apiConfig.model) {
      // 如果没有API配置，使用模拟回复
      if (chat.isGroup && chat.members) {
        await simulateGroupChat(updatedChat, []);
      } else {
        await simulateSingleChat(updatedChat);
      }
      return;
    }

    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(updatedChat);
      const messagesPayload = buildMessagesPayload(updatedChat);

      const response = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messagesPayload
          ],
          temperature: 0.8,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const aiResponseContent = data.choices[0].message.content;
      
      // 解析AI回复（支持多条消息）
      const messagesArray = parseAiResponse(aiResponseContent);
      
      // 处理每条AI消息
      let messageTimestamp = Date.now();
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
        const aiMessage = await createAiMessage(msgData, chat, messageTimestamp++);
        if (aiMessage) {
          const chatWithMessage = {
            ...updatedChat,
            messages: [...updatedChat.messages, aiMessage],
            lastMessage: aiMessage.content,
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          };
          onUpdateChat(chatWithMessage);
          updatedChat = chatWithMessage; // 更新引用，确保下一条消息基于最新状态
        }
      }

    } catch (error) {
      console.error('AI回复失败:', error instanceof Error ? error.message : '未知错误');
      // 回退到模拟回复
      if (chat.isGroup && chat.members) {
        await simulateGroupChat(updatedChat, []);
      } else {
        await simulateSingleChat(updatedChat);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 构建系统提示词
  const buildSystemPrompt = (chat: ChatItem): string => {
    const now = new Date();
    const currentTime = now.toLocaleString('zh-CN', { dateStyle: 'full', timeStyle: 'short' });
    const myNickname = chat.settings.myNickname || '我';

    if (chat.isGroup && chat.members) {
      // 群聊系统提示词
      const membersList = chat.members.map(m => `- **${m.originalName}**: ${m.persona}`).join('\n');
      
      return `你是一个群聊AI，负责扮演【除了用户以外】的所有角色。

# 核心规则
1. **【身份铁律】**: 用户的身份是【${myNickname}】。你【绝对、永远、在任何情况下都不能】生成name字段为"${myNickname}"或"${chat.name}"的消息。
2. **【输出格式】**: 你的回复【必须】是一个JSON数组格式的字符串。数组中的【每一个元素都必须是一个带有"type"和"name"字段的JSON对象】。
3. **角色扮演**: 严格遵守下方"群成员列表及人设"中的每一个角色的设定。
4. **禁止出戏**: 绝不能透露你是AI、模型，或提及"扮演"、"生成"等词语。
5. **情景感知**: 注意当前时间是 ${currentTime}。

## 你可以使用的操作指令:
- **发送文本**: {"type": "text", "name": "角色名", "message": "文本内容"}
- **发送表情**: {"type": "sticker", "name": "角色名", "url": "表情URL", "meaning": "表情含义"}
- **发送图片**: {"type": "ai_image", "name": "角色名", "description": "图片描述"}
- **发送语音**: {"type": "voice_message", "name": "角色名", "content": "语音内容"}
- **拍一拍用户**: {"type": "pat_user", "name": "角色名", "suffix": "后缀"}

# 群成员列表及人设
${membersList}

# 用户的角色
- **${myNickname}**: ${chat.settings.myPersona}

现在，请根据以上规则和对话历史，继续这场群聊。`;
    } else {
      // 单聊系统提示词
      return `你现在扮演一个名为"${chat.name}"的角色。

# 你的角色设定：
${chat.settings.aiPersona}

# 你的任务与规则：
1. **【输出格式】**: 你的回复【必须】是一个JSON数组格式的字符串。数组中的【每一个元素都必须是一个带有type字段的JSON对象】。
2. **对话节奏**: 模拟真人的聊天习惯，你可以一次性生成多条短消息。每次要回复至少3-8条消息！！！
3. **情景感知**: 你需要感知当前的时间(${currentTime})。
4. **禁止出戏**: 绝不能透露你是AI、模型，或提及"扮演"、"生成"等词语。

# 你可以使用的操作指令:
- **发送文本**: {"type": "text", "content": "文本内容"}
- **发送表情**: {"type": "sticker", "url": "表情URL", "meaning": "表情含义"}
- **发送图片**: {"type": "ai_image", "description": "图片描述"}
- **发送语音**: {"type": "voice_message", "content": "语音内容"}
- **拍一拍用户**: {"type": "pat_user", "suffix": "后缀"}

# 对话者的角色设定：
${chat.settings.myPersona}

现在，请根据以上规则和对话历史，继续进行对话。`;
    }
  };

  // 构建消息载荷
  const buildMessagesPayload = (chat: ChatItem) => {
    const maxMemory = 10;
    const historySlice = chat.messages.slice(-maxMemory);
    const myNickname = chat.settings.myNickname || '我';

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
      } else {
        content = `${prefix}${msg.content}`;
      }
      
      return { role: 'user', content };
    }).filter(Boolean);
  };

  // 解析AI回复
  const parseAiResponse = (content: string) => {
    try {
      // 尝试解析JSON数组
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // 如果不是数组，包装成数组
      return [parsed];
    } catch (error) {
      // 如果解析失败，当作普通文本处理
      return [{ type: 'text', content }];
    }
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
        content = String(msgData.content || msgData.message || '');
        type = 'text';
        break;
      case 'sticker':
        content = String(msgData.meaning || '表情');
        type = 'sticker';
        meaning = msgData.meaning ? String(msgData.meaning) : undefined;
        url = msgData.url ? String(msgData.url) : undefined;
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
      default:
        content = String(msgData.content || msgData.message || '');
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
      url
    };

    return aiMessage;
  };

  // 模拟单聊回复
  const simulateSingleChat = async (chat: ChatItem) => {
    const responses = [
      '收到你的消息了！',
      '嗯嗯，我在听',
      '好的，我明白了',
      '没问题',
      '收到',
      '我在',
      '好的，继续',
      '明白了'
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: randomResponse,
      timestamp: Date.now(),
      senderName: chat.name,
      senderAvatar: chat.settings.aiAvatar
    };

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, aiMessage],
      lastMessage: aiMessage.content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    
    onUpdateChat(updatedChat);
  };

    // 模拟群聊回复（无API配置时）
  const simulateGroupChat = async (updatedChat: ChatItem, mentionedMembers: GroupMember[]) => {
    const membersToReply = mentionedMembers.length > 0 
      ? mentionedMembers 
      : getRandomMembers(chat.members!, 1, 2);

    for (let i = 0; i < membersToReply.length; i++) {
      const member = membersToReply[i];
      const delay = (i + 1) * 1000; // 每个成员回复间隔1秒

      setTimeout(() => {
        const responses = [
          '收到！',
          '好的，我明白了',
          '嗯嗯，我知道了',
          '没问题',
          '收到消息了',
          '我在听',
          '好的，继续',
          '明白了',
          '收到',
          '我在'
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const memberReply: Message = {
          id: (Date.now() + i + 1).toString(),
          role: 'assistant',
          content: randomResponse,
          timestamp: Date.now() + delay,
          senderName: member.groupNickname,
          senderAvatar: member.avatar
        };
        
        const chatWithReply = {
          ...updatedChat,
          messages: [...updatedChat.messages, memberReply],
          lastMessage: memberReply.content,
          timestamp: new Date(memberReply.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        onUpdateChat(chatWithReply);
      }, delay);
    }
  };

  // 获取随机群成员
  const getRandomMembers = (members: GroupMember[], min: number, max: number): GroupMember[] => {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...members].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
            {msg.url && (
              <img 
                src={msg.url} 
                alt={msg.meaning || '表情'} 
                className="sticker-image"
                onError={(e) => {
                  // 如果图片加载失败，显示文字
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('fallback-hidden');
                }}
              />
            )}
            <span className={`sticker-fallback ${msg.url ? 'fallback-hidden' : ''}`}>
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
      case 'image':
        return (
          <div className="image-message">
            <img 
              src={msg.content} 
              alt="用户图片" 
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
        return <span>{msg.content}</span>;
    }
  };

  return (
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
            <span className="chat-status">
              {chat.isGroup && chat.members ? `${chat.members.length}人` : '在线'}
            </span>
          </div>
        </div>
        <div className="chat-actions">
          {chat.isGroup && (
            <button 
              className="action-btn"
              onClick={() => setShowMemberManager(true)}
              title="群成员管理"
            >
              👥
            </button>
          )}
          <button className="action-btn">⋯</button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="messages-container">
        {chat.messages.length === 0 ? (
          <div className="empty-chat">
            <p>开始和 {chat.name} 聊天吧！</p>
          </div>
        ) : (
          chat.messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'} ${chat.isGroup ? 'group-message' : ''}`}
              onDoubleClick={() => handleQuoteMessage(msg)}
            >
              <div className="message-avatar">
                <Image 
                  src={msg.senderAvatar || (msg.role === 'user' ? chat.settings.myAvatar : chat.avatar)}
                  alt={msg.senderName || (msg.role === 'user' ? (chat.settings.myNickname || '我') : chat.name)}
                  width={30}
                  height={30}
                />
              </div>
              <div className="message-content">
                {chat.isGroup && msg.senderName && (
                  <div className="message-sender">{msg.senderName}</div>
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
                <div className="message-bubble">
                  {renderMessageContent(msg)}
                </div>
                <div className="message-time">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* AI正在输入指示器 */}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-avatar">
              <Image 
                src={chat.avatar}
                alt={chat.name}
                width={30}
                height={30}
              />
            </div>
            <div className="message-content">
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
            placeholder={chat.isGroup ? "输入消息，@可提及群成员..." : "输入消息..."}
            rows={1}
            disabled={isLoading}
          />
          <button 
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
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
        />
      )}
    </div>
  );
} 