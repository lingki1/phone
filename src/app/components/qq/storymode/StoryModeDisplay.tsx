'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Message, ChatItem } from '../../../types/chat';
import './StoryModeDisplay.css';

interface StoryModeDisplayProps {
  messages: Message[];
  chat: ChatItem;
  onQuoteMessage: (msg: Message) => void;
  onEditMessage: (messageId: string, currentContent: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteMessage: (messageId: string) => void;
  onRegenerateAI: (messageId: string) => void;
  editingMessage: { id: string, content: string } | null;
  setEditingMessage: (editing: { id: string, content: string } | null) => void;
}

export default function StoryModeDisplay({
  messages,
  chat,
  onQuoteMessage,
  onEditMessage,
  onSaveEdit,
  onCancelEdit,
  onDeleteMessage,
  onRegenerateAI,
  editingMessage,
  setEditingMessage
}: StoryModeDisplayProps) {
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const [visibleActions, setVisibleActions] = useState<Set<string>>(new Set());
  // 分页与滚动状态
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // 滚动到底部函数
  const scrollToBottom = useCallback((smooth = true) => {
    if (storyContainerRef.current) {
      storyContainerRef.current.scrollTo({
        top: storyContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // 初始化与更新显示的消息（仅展示最新的20条）
  useEffect(() => {
    const INITIAL_MESSAGE_COUNT = 20;
    if (messages.length <= INITIAL_MESSAGE_COUNT) {
      setDisplayedMessages(messages);
      setHasMoreMessages(false);
    } else {
      const latestMessages = messages.slice(-INITIAL_MESSAGE_COUNT);
      setDisplayedMessages(latestMessages);
      setHasMoreMessages(true);
    }
    // 如果用户在底部，则确保滚动到底部（不使用动画，避免进入页面时的跳动）
    if (shouldAutoScroll && messages.length > 0) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [messages, shouldAutoScroll, scrollToBottom]);

  // 组件挂载时直接设置滚动位置到最新消息（不使用滚动动画）
  useEffect(() => {
    requestAnimationFrame(() => {
      if (storyContainerRef.current) {
        storyContainerRef.current.scrollTop = storyContainerRef.current.scrollHeight;
      }
    });
  }, []);

  // 监听滚动，判断是否在底部，决定是否自动滚动
  const handleScroll = useCallback(() => {
    if (!storyContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = storyContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px 容差
    setShouldAutoScroll(prev => (prev !== isAtBottom ? isAtBottom : prev));
  }, []);

  // 加载更多历史消息（将更早的消息插入到显示列表开头）
  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreMessages) return;
    const container = storyContainerRef.current;
    if (!container) return;

    const BATCH_SIZE = 20;
    const alreadyDisplayed = displayedMessages.length;
    const remaining = messages.length - alreadyDisplayed;
    if (remaining <= 0) {
      setHasMoreMessages(false);
      return;
    }

    setIsLoadingMoreMessages(true);

    const oldHeight = container.scrollHeight;
    const loadCount = Math.min(BATCH_SIZE, remaining);
    const startIndex = Math.max(0, messages.length - alreadyDisplayed - loadCount);
    const endIndex = messages.length - alreadyDisplayed;
    const olderMessages = messages.slice(startIndex, endIndex);

    setDisplayedMessages(prev => {
      const newDisplayed = [...olderMessages, ...prev];
      setHasMoreMessages(newDisplayed.length < messages.length);
      return newDisplayed;
    });

    // 使用微小延迟等待渲染完成后，保持滚动位置
    requestAnimationFrame(() => {
      const newHeight = container.scrollHeight;
      const heightDiff = newHeight - oldHeight;
      container.scrollTop = container.scrollTop + heightDiff;
      setIsLoadingMoreMessages(false);
    });
  }, [displayedMessages.length, isLoadingMoreMessages, messages]);
  
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // 解析装饰文本的函数
  const parseDecoratedText = useCallback((text: string) => {
    // 安全地解析HTML标签，只允许特定的标签
    const parseHtml = (html: string) => {
      // 移除所有危险的标签和属性
      const cleanHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');
      
      return <span dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
    };

    // 先处理时间标记：[时间]
    text = text.replace(/\[(.*?)\]/g, '<span class="story-time-mark">$1</span>');
    
    // 处理括号格式：(文本)
    text = text.replace(/\((.*?)\)/g, '<span class="story-mental-text">$1</span>');
    
    // 处理加粗：**文本**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体：*文本* (需要更精确的匹配，避免与加粗冲突)
    text = text.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, (match, content) => {
      // 如果内容包含引号，说明是对话
      if (content.includes('"') || content.includes('"') || content.includes('"')) {
        return `<em>${content}</em>`;
      }
      // 否则作为声音效果处理
      return `<span class="story-sound-effect">${content}</span>`;
    });
    
    return parseHtml(text);
  }, []);

  // 解析并渲染HTML模块的函数
  const parseHtmlModule = useCallback((text: string) => {
    // 检测HTML模块标记：{{html: ... }}
    const htmlModuleRegex = /\{\{html:(.*?)\}\}/g;
    
    if (!htmlModuleRegex.test(text)) {
      // 如果没有HTML模块，直接返回解析后的文本
      return parseDecoratedText(text);
    }
    
    // 分割文本，分离普通文本和HTML模块
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;
    
    htmlModuleRegex.lastIndex = 0; // 重置正则表达式索引
    
    while ((match = htmlModuleRegex.exec(text)) !== null) {
      // 添加HTML模块之前的普通文本
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText.trim()) {
          parts.push(parseDecoratedText(beforeText));
        }
      }
      
      // 解析并添加HTML模块
      const htmlContent = match[1].trim();
      try {
        // 安全地渲染HTML内容
        const cleanHtml = htmlContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
          .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/javascript:/gi, '');
        
        parts.push(
          <span 
            key={`html-${match.index}`}
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        );
      } catch (error) {
        console.error('Failed to parse HTML module:', error);
        parts.push(<span key={`html-${match.index}`} className="story-html-error">HTML渲染失败</span>);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push(parseDecoratedText(remainingText));
      }
    }
    
    return parts.length > 0 ? parts : parseDecoratedText(text);
  }, [parseDecoratedText]);

  const renderStoryContent = useCallback((content: string) => {
    // 处理换行符，将\n转换为<br>标签
    const lines = content.split('\n');
    
    return lines.map((line, lineIndex) => (
      <React.Fragment key={lineIndex}>
        {parseHtmlModule(line)}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  }, [parseHtmlModule]);

  // 点击外部关闭操作按钮
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.story-message')) {
        setVisibleActions(new Set());
      }
    };

    if (visibleActions.size > 0) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [visibleActions]);

  const renderMessage = useCallback((msg: Message) => {
    const isUser = msg.role === 'user';
    const isEditing = editingMessage?.id === msg.id;
    const isActionsVisible = visibleActions.has(msg.id);
    const isError = msg.senderName === '系统' || msg.id.includes('_story_error_');
    
      // 点击切换功能按键显示
  const handleMessageClick = () => {
    if (isActionsVisible) {
      // 如果已显示，则隐藏
      setVisibleActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(msg.id);
        return newSet;
      });
    } else {
      // 如果未显示，则显示
      setVisibleActions(prev => new Set([...prev, msg.id]));
    }
  };
    
    return (
      <div 
        key={msg.id} 
        className={`story-message ${isUser ? 'story-user-message' : isError ? 'story-error-message' : 'story-ai-message'}`}
        onClick={handleMessageClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="story-message-header">
          <div className="story-message-info">
            <div className="story-message-sender">
              {isUser ? '我' : (msg.senderName || chat.name)}
            </div>
            <div className="story-message-time">
              {formatTime(msg.timestamp)}
            </div>
          </div>
          <div 
            className={`story-message-actions ${isActionsVisible ? 'visible' : 'hidden'}`}
            style={{ 
              opacity: isActionsVisible ? 1 : 0,
              pointerEvents: isActionsVisible ? 'auto' : 'none',
              transition: 'opacity 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()} // 防止点击功能按键时触发消息点击
          >
            <button 
              className="story-action-btn"
              onClick={() => onQuoteMessage(msg)}
              title="引用"
            >
              💬
            </button>
            {(isUser || !isUser) && (
              <>
                <button 
                  className="story-action-btn"
                  onClick={() => onEditMessage(msg.id, msg.content)}
                  title="编辑"
                >
                  ✏️
                </button>
                <button 
                  className="story-action-btn"
                  onClick={() => onDeleteMessage(msg.id)}
                  title="删除"
                >
                  🗑️
                </button>
              </>
            )}
            {!isUser && (
              <button 
                className="story-action-btn"
                onClick={() => onRegenerateAI(msg.id)}
                title="重新生成"
              >
                🔄
              </button>
            )}
          </div>
        </div>
        
        <div className="story-message-content">
          {isEditing ? (
            <div className="story-edit-container">
              <textarea
                value={editingMessage.content}
                onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                className="story-edit-textarea"
                autoFocus
                onClick={(e) => e.stopPropagation()} // 防止点击编辑框时触发消息点击
              />
              <div className="story-edit-actions">
                <button 
                  className="story-save-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // 防止触发消息点击
                    onSaveEdit();
                  }}
                >
                  保存
                </button>
                <button 
                  className="story-cancel-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // 防止触发消息点击
                    onCancelEdit();
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="story-content-text">
              {renderStoryContent(msg.content)}
            </div>
          )}
        </div>
      </div>
    );
  }, [chat, editingMessage, formatTime, renderStoryContent, onQuoteMessage, onEditMessage, onSaveEdit, onCancelEdit, onDeleteMessage, onRegenerateAI, setEditingMessage, visibleActions]);

  return (
    <div className="story-display-container" ref={storyContainerRef} onScroll={handleScroll}>
      {messages.length === 0 ? (
        <div className="story-empty-state">
          <div className="story-empty-icon">📖</div>
          <div className="story-empty-text">
            开始编写你的剧情故事吧！
          </div>
          <div className="story-empty-hint">
            点击下方输入框开始创作
          </div>
        </div>
      ) : (
        <div className="story-messages-list">
          {hasMoreMessages && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <button 
                className="story-action-btn"
                onClick={handleLoadMore}
                disabled={isLoadingMoreMessages}
                title="加载更多历史剧情"
              >
                {isLoadingMoreMessages ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
          {displayedMessages.map((msg) => renderMessage(msg))}
        </div>
      )}
    </div>
  );
}
