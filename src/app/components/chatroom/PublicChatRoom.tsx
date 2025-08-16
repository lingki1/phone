'use client';

import { useState, useEffect, useRef } from 'react';
import './PublicChatRoom.css';
import { 
  ChatRoomState 
} from './types';
import {
  loadChatData,
  addMessage,
  getOrCreateUser,
  validateNickname,
  canUserSendMessage,
  getRemainingWaitTime,
  formatTimestamp,
  cleanupOldUsers
} from './chatService';

interface PublicChatRoomProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PublicChatRoom({ isOpen, onClose }: PublicChatRoomProps) {
  const [state, setState] = useState<ChatRoomState>({
    messages: [],
    users: [],
    currentUser: null,
    isConnected: false,
    lastRefresh: 0
  });

  const [inputMessage, setInputMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化聊天室
  useEffect(() => {
    if (isOpen) {
      initializeChatRoom();
    } else {
      cleanup();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // 定期刷新消息
  useEffect(() => {
    if (isOpen && state.currentUser) {
      const interval = setInterval(() => {
        refreshMessages();
      }, 5000); // 每5秒刷新一次

      refreshTimerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [isOpen, state.currentUser]);

  // 冷却时间倒计时
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(prev => prev - 1);
      }, 1000);
      cooldownTimerRef.current = timer;
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const initializeChatRoom = async () => {
    setIsLoading(true);
    
    // 清理过期用户（服务器端自动处理）
    cleanupOldUsers();
    
    // 检查是否有保存的昵称
    const savedNickname = localStorage.getItem('chatroom-nickname');
    if (savedNickname) {
      const validationResult = validateNickname(savedNickname);
      if (validationResult.valid) {
        try {
          setNickname(savedNickname);
          const user = await getOrCreateUser(savedNickname);
          setState(prev => ({
            ...prev,
            currentUser: user,
            isConnected: true
          }));
          await refreshMessages();
        } catch (error) {
          console.error('初始化用户失败:', error);
          setIsNicknameModalOpen(true);
        }
      } else {
        setIsNicknameModalOpen(true);
      }
    } else {
      setIsNicknameModalOpen(true);
    }
    
    setIsLoading(false);
  };

  const refreshMessages = async () => {
    try {
      const data = await loadChatData();
      
      setState(prev => ({
        ...prev,
        messages: data.messages,
        users: data.users,
        lastRefresh: Date.now()
      }));
    } catch (error) {
      console.error('刷新消息失败:', error);
    }
  };

  const cleanup = () => {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  const handleNicknameSubmit = async () => {
    const trimmedNickname = nickname.trim();
    const validationResult = validateNickname(trimmedNickname);
    
    if (!validationResult.valid) {
      setNicknameError(validationResult.error || '昵称无效');
      return;
    }

    try {
      const user = await getOrCreateUser(trimmedNickname);
      localStorage.setItem('chatroom-nickname', trimmedNickname);
      
      setState(prev => ({
        ...prev,
        currentUser: user,
        isConnected: true
      }));
      
      setIsNicknameModalOpen(false);
      setNicknameError('');
      await refreshMessages();
      
      // 聚焦到输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('设置昵称失败:', error);
      setNicknameError('设置昵称失败，请重试');
    }
  };

  const handleSendMessage = async () => {
    if (!state.currentUser || !inputMessage.trim()) return;

    // 检查冷却时间
    if (!canUserSendMessage(state.currentUser)) {
      const remainingTime = getRemainingWaitTime(state.currentUser);
      setCooldownTime(remainingTime);
      return;
    }

    try {
      const message = await addMessage(inputMessage.trim(), state.currentUser);
      
      // 更新本地状态
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message],
        currentUser: prev.currentUser ? {
          ...prev.currentUser,
          lastMessageTime: Date.now()
        } : null
      }));

      setInputMessage('');
      setCooldownTime(30); // 设置30秒冷却时间
      
      // 立即刷新消息以获取最新状态
      setTimeout(refreshMessages, 100);
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage = error instanceof Error ? error.message : '发送消息失败，请重试';
      
      // 如果是频率限制错误，设置冷却时间
      if (errorMessage.includes('等待')) {
        const match = errorMessage.match(/(\d+)\s*秒/);
        if (match) {
          setCooldownTime(parseInt(match[1]));
        }
      } else {
        alert(errorMessage);
      }
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNicknameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNicknameSubmit();
    }
  };

  const canSend = state.currentUser && 
                 inputMessage.trim().length > 0 && 
                 canUserSendMessage(state.currentUser);

  if (!isOpen) return null;

  return (
    <div className="public-chatroom">
      {/* 头部导航 */}
      <div className="chatroom-header">
        <button className="chatroom-back-button" onClick={onClose}>
          ←
        </button>
        <h1 className="chatroom-title">
          💬 公共聊天室
        </h1>
        <div className="chatroom-online-count">
          {state.users.length} 人在线
        </div>
      </div>

      {/* 昵称设置模态框 */}
      {isNicknameModalOpen && (
        <div className="chatroom-nickname-modal">
          <div className="chatroom-nickname-form">
            <h2>设置昵称</h2>
            <p>请设置一个昵称来开始聊天</p>
            <input
              type="text"
              className="chatroom-nickname-input"
              placeholder="输入您的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyPress={handleNicknameKeyPress}
              maxLength={20}
              autoFocus
            />
            {nicknameError && (
              <div className="chatroom-nickname-error">{nicknameError}</div>
            )}
            <div className="chatroom-nickname-buttons">
              <button 
                className="chatroom-nickname-button secondary" 
                onClick={onClose}
              >
                取消
              </button>
              <button 
                className="chatroom-nickname-button primary"
                onClick={handleNicknameSubmit}
                disabled={!nickname.trim()}
              >
                开始聊天
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 聊天消息区域 */}
      <div className="chatroom-chat-messages">
        {isLoading ? (
          <div className="chatroom-loading-messages">
            <span className="chatroom-loading-spinner"></span>
            正在加载聊天记录...
          </div>
        ) : state.messages.length === 0 ? (
          <div className="chatroom-empty-messages">
            <span className="icon">💬</span>
            还没有人发言，快来说点什么吧！
          </div>
        ) : (
          state.messages.map((message) => (
            <div key={message.id} className="chatroom-message-item">
              <div className="chatroom-message-header">
                <span className="chatroom-message-nickname">{message.nickname}</span>
                <span className="chatroom-message-time">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className="chatroom-message-content">
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      {state.currentUser && (
        <div className="chatroom-chat-input-area">
          {cooldownTime > 0 && (
            <div className="chatroom-cooldown-indicator">
              请等待 {cooldownTime} 秒后再发送消息
            </div>
          )}
          
          <div className="chatroom-input-container">
            <textarea
              ref={inputRef}
              className="chatroom-message-input"
              placeholder="输入消息..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleInputKeyPress}
              rows={1}
              maxLength={500}
            />
            <button
              className="chatroom-send-button"
              onClick={handleSendMessage}
              disabled={!canSend}
              title={canSend ? '发送消息' : '请等待冷却时间'}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
