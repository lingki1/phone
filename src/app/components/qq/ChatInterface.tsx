'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Message, ChatItem, GroupMember, QuoteMessage } from '../../types/chat';
import GroupMemberManager from './GroupMemberManager';
import './ChatInterface.css';

interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
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
  onEditChat?: (chat: ChatItem) => void;
  onDeleteChat?: (chatId: string) => void;
  personalSettings?: PersonalSettings;
}

export default function ChatInterface({ 
  chat, 
  apiConfig, 
  onBack, 
  onUpdateChat,
  availableContacts,
  onEditChat,
  onDeleteChat,
  personalSettings
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAiUser, setCurrentAiUser] = useState<{name: string, avatar: string} | null>(null);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<QuoteMessage | undefined>(undefined);
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 添加点击空白区域关闭聊天菜单的功能
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // 关闭聊天菜单
      if (showChatMenu && !target.closest('.chat-actions')) {
        setShowChatMenu(false);
      }
    };

    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    
    // 清理事件监听器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatMenu]);

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
    await triggerAiResponse(updatedChat);
  };

  // 触发AI回复的核心函数
  const triggerAiResponse = async (updatedChat: ChatItem) => {
    if (!apiConfig.proxyUrl || !apiConfig.apiKey || !apiConfig.model) {
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
        const aiMessage = await createAiMessage(msgData, chat, messageTimestamp++);
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
          
          // 添加延迟，模拟人类打字效果（除了最后一条消息）
          if (messagesArray.indexOf(msgData) < messagesArray.length - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 500));
          }
        }
      }

    } catch (error) {
      console.error('AI回复失败:', error);
      // API请求失败时显示错误提示
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'AI回复失败，请检查API配置是否正确，包括代理地址、API密钥和模型名称。',
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
    }
  };

  // 构建系统提示词
  const buildSystemPrompt = (chat: ChatItem): string => {
    const now = new Date();
    const currentTime = now.toLocaleString('zh-CN', { dateStyle: 'full', timeStyle: 'short' });
    const myNickname = personalSettings?.userNickname || chat.settings.myNickname || '我';
    const myPersona = personalSettings?.userBio || chat.settings.myPersona || '用户';

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
- **发送表情**: {"type": "sticker", "name": "角色名", "meaning": "表情含义"} (注意：不允许使用url字段，不能发送链接图片)
- **发送图片**: {"type": "ai_image", "name": "角色名", "description": "图片描述"}
- **发送语音**: {"type": "voice_message", "name": "角色名", "content": "语音内容"}
- **拍一拍用户**: {"type": "pat_user", "name": "角色名", "suffix": "后缀"}

# 群成员列表及人设
${membersList}

# 用户的角色
- **${myNickname}**: ${myPersona}

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
- **发送表情**: {"type": "sticker", "meaning": "表情含义"} (注意：不允许使用url字段，不能发送链接图片)
- **发送图片**: {"type": "ai_image", "description": "图片描述"}
- **发送语音**: {"type": "voice_message", "content": "语音内容"}
- **拍一拍用户**: {"type": "pat_user", "suffix": "后缀"}

# 对话者的角色设定：
${myPersona}

现在，请根据以上规则和对话历史，继续进行对话。`;
    }
  };

  // 构建消息载荷
  const buildMessagesPayload = (chat: ChatItem) => {
    const maxMemory = 10;
    const historySlice = chat.messages.slice(-maxMemory);
    const myNickname = personalSettings?.userNickname || chat.settings.myNickname || '我';

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
      url
    };

    return aiMessage;
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理编辑聊天
  const handleEditChat = () => {
    setShowChatMenu(false);
    // 这里需要调用父组件的编辑功能
    // 由于当前组件没有直接访问编辑功能，我们需要通过props传递
    if (onEditChat) {
      onEditChat(chat);
    }
  };

  // 处理删除聊天
  const handleDeleteChat = () => {
    setShowChatMenu(false);
    if (confirm('确定要删除这个聊天吗？')) {
      if (onDeleteChat) {
        onDeleteChat(chat.id);
      }
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
          <button 
            className="action-btn"
            onClick={() => setShowChatMenu(!showChatMenu)}
            title="更多操作"
          >
            ⋯
          </button>
        </div>
      </div>

      {/* 聊天菜单 */}
      {showChatMenu && (
        <div className="chat-menu-overlay">
          <div className="chat-menu">
            <button className="chat-menu-item" onClick={handleEditChat}>
              <span>编辑</span>
            </button>
            <button className="chat-menu-item delete" onClick={handleDeleteChat}>
              <span>删除</span>
            </button>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="messages-container">
        {chat.messages.length === 0 ? (
          <div className="empty-chat">
            <p>开始和 {chat.name} 聊天吧！</p>
          </div>
        ) : (
          chat.messages.map((msg, index) => {
            // 获取发送者信息
            const getSenderInfo = () => {
              if (msg.role === 'user') {
                return {
                  name: personalSettings?.userNickname || chat.settings.myNickname || '我',
                  avatar: personalSettings?.userAvatar || chat.settings.myAvatar || '/avatars/user-avatar.svg'
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
                  <div className="message-bubble">
                    {renderMessageContent(msg)}
                  </div>
                  <div className="message-time">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* AI正在输入指示器 */}
        {isLoading && (
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