'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Message, ChatItem, GroupMember, QuoteMessage } from '../types/chat';
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

    // 如果是群聊，需要处理群成员回复
    if (chat.isGroup && chat.members) {
      // 检查是否@了某个成员
      const mentionedMembers = chat.members.filter(member => 
        message.includes(`@${member.groupNickname}`)
      );

      // 如果没有API配置，模拟群成员回复
      if (!apiConfig.proxyUrl || !apiConfig.apiKey || !apiConfig.model) {
        await simulateGroupChat(updatedChat, mentionedMembers);
        return;
      }

      // 如果有API配置，让群成员使用AI回复
      if (mentionedMembers.length > 0) {
        await handleAIGroupChat(updatedChat, mentionedMembers, userMessage);
      } else {
        // 如果没有@任何人，随机选择1-2个成员回复
        const randomMembers = getRandomMembers(chat.members!, 1, 2);
        await handleAIGroupChat(updatedChat, randomMembers, userMessage);
      }
    } else {
      // 单聊逻辑保持不变
      await handleSingleChat(updatedChat, userMessage);
    }
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

  // 处理AI群聊回复
  const handleAIGroupChat = async (updatedChat: ChatItem, membersToReply: GroupMember[], userMessage: Message) => {
    setIsLoading(true);

    try {
      for (let i = 0; i < membersToReply.length; i++) {
        const member = membersToReply[i];
        const delay = (i + 1) * 2000; // 每个成员回复间隔2秒

        setTimeout(async () => {
          try {
            // 构建消息历史，包含群聊上下文
            const recentMessages = chat.messages.slice(-10);
            const messages = [
              {
                role: 'system',
                content: `${member.persona}\n\n你现在在一个群聊中，群聊名称：${chat.name}。你是群成员"${member.groupNickname}"。请根据你的角色人设回复消息。回复要自然、符合角色特点，不要太长。记住你是${member.groupNickname}，不是用户。`
              },
              ...recentMessages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: `${msg.senderName ? `[${msg.senderName}]: ` : ''}${msg.content}`
              })),
              {
                role: 'user',
                content: `[${userMessage.senderName}]: ${userMessage.content}`
              }
            ];

            const response = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.apiKey}`
              },
              body: JSON.stringify({
                model: apiConfig.model,
                messages: messages,
                temperature: 0.8,
                max_tokens: 150
              })
            });

            if (response.ok) {
              const data = await response.json();
              const aiResponse = data.choices[0]?.message?.content || '收到！';

              const memberReply: Message = {
                id: (Date.now() + i + 1).toString(),
                role: 'assistant',
                content: aiResponse,
                timestamp: Date.now() + delay,
                senderName: member.groupNickname,
                senderAvatar: member.avatar
              };

              const finalChat = {
                ...updatedChat,
                messages: [...updatedChat.messages, memberReply],
                lastMessage: memberReply.content,
                timestamp: new Date(memberReply.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              };
              onUpdateChat(finalChat);
            }
          } catch (error) {
            console.error(`群成员${member.groupNickname}AI回复失败:`, error);
          }
        }, delay);
      }
    } catch (error) {
      console.error('群聊AI回复失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理单聊
  const handleSingleChat = async (updatedChat: ChatItem, userMessage: Message) => {
    if (!apiConfig.proxyUrl || !apiConfig.apiKey || !apiConfig.model) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '请先在API设置中配置反代地址、密钥并选择模型。',
        timestamp: Date.now() + 1
      };
      const chatWithError = {
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage]
      };
      onUpdateChat(chatWithError);
      return;
    }

    setIsLoading(true);

    try {
      const messages = [
        {
          role: 'system',
          content: chat.persona
        },
        ...chat.messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage.content
        }
      ];

      const response = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: messages,
          temperature: 0.9,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '抱歉，我没有收到有效的回复。';

      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now() + 2
      };

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage],
        lastMessage: aiResponse,
        timestamp: new Date(aiMessage.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateChat(finalChat);
    } catch (error) {
      console.error('AI回复失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `抱歉，AI回复失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now() + 2
      };
      const chatWithError = {
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage]
      };
      onUpdateChat(chatWithError);
    } finally {
      setIsLoading(false);
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
                  {msg.content}
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