'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  cleanupOldUsers,
  updateUserNickname,
  grantAdminByNickname,
  deleteMessage
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const awayFromBottomTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshMessages = useCallback(async () => {
    try {
      const data = await loadChatData();
      setState(prev => {
        const matched = prev.currentUser
          ? data.users.find(u => u.id === prev.currentUser!.id || u.nickname === prev.currentUser!.nickname)
          : undefined;
        const updatedCurrentUser = prev.currentUser && matched && matched.isAdmin !== prev.currentUser.isAdmin
          ? { ...prev.currentUser, isAdmin: matched.isAdmin }
          : prev.currentUser;
        return {
          ...prev,
          messages: data.messages,
          users: data.users,
          lastRefresh: Date.now(),
          currentUser: updatedCurrentUser
        };
      });
    } catch (error) {
      console.error('刷新消息失败:', error);
    }
  }, []);

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
  }, [isOpen, state.currentUser, refreshMessages]);

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

  // 监听滚动，决定是否显示“回到底部”按钮
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      setShowScrollToBottom(!atBottom);
      // 离开底部后，几秒钟后自动回到底部
      if (atBottom) {
        if (awayFromBottomTimerRef.current) {
          clearTimeout(awayFromBottomTimerRef.current);
          awayFromBottomTimerRef.current = null;
        }
      } else {
        if (awayFromBottomTimerRef.current) {
          clearTimeout(awayFromBottomTimerRef.current);
        }
        awayFromBottomTimerRef.current = setTimeout(() => {
          scrollToBottom();
        }, 6000); // 6秒后强制回到底部
      }
    };
    el.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // 移动端键盘弹出时，自动将输入框滚动到可视区域，并预留底部空间
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;
    if (!vv) return;
    const handleVvChange = () => {
      const offset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      setKeyboardOffset(offset);
      // 确保输入框在视口内
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
    };
    vv.addEventListener('resize', handleVvChange);
    vv.addEventListener('scroll', handleVvChange);
    return () => {
      vv.removeEventListener('resize', handleVvChange);
      vv.removeEventListener('scroll', handleVvChange);
    };
  }, []);

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

    // 支持命令：/name 新名字 —— 修改当前用户昵称，不发送消息
    if (inputMessage.trim().toLowerCase().startsWith('/name ')) {
      const newName = inputMessage.trim().slice(6).trim();
      const validation = validateNickname(newName);
      if (!validation.valid) {
        alert(validation.error || '昵称无效');
        return;
      }
      try {
        const updatedUser = await updateUserNickname(state.currentUser.id, newName);
        localStorage.setItem('chatroom-nickname', updatedUser.nickname);
        setState(prev => ({
          ...prev,
          currentUser: prev.currentUser ? { ...prev.currentUser, nickname: updatedUser.nickname } : prev.currentUser
        }));
        setInputMessage('');
        // 刷新消息与在线用户列表
        setTimeout(refreshMessages, 100);
      } catch (e) {
        alert(e instanceof Error ? e.message : '更新昵称失败');
      }
      return;
    }

    // 支持命令：/admin 用户名 930117 —— 授予该用户管理员（仅凭授权码）
    if (inputMessage.trim().toLowerCase().startsWith('/admin ')) {
      const args = inputMessage.trim().slice(7).trim().split(/\s+/);
      if (args.length < 2) {
        alert('用法：/admin 用户名 930117');
        return;
      }
      const targetName = args.slice(0, args.length - 1).join(' ');
      const code = args[args.length - 1];
      try {
        const updatedUser = await grantAdminByNickname(targetName, code);
        // 如果自己被授予，则更新本地 currentUser
        if (state.currentUser && (state.currentUser.id === updatedUser.id || state.currentUser.nickname === updatedUser.nickname)) {
          setState(prev => ({
            ...prev,
            currentUser: prev.currentUser ? { ...prev.currentUser, isAdmin: true } : prev.currentUser
          }));
        }
        setInputMessage('');
        setTimeout(refreshMessages, 100);
      } catch (e) {
        alert(e instanceof Error ? e.message : '授权失败');
      }
      return;
    }

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
      <div className="chatroom-chat-messages" ref={messagesContainerRef}>
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
          state.messages.map((message) => {
            const isSelf = state.currentUser && message.nickname === state.currentUser.nickname;
            const matchedUser = state.users.find(u => u.nickname === message.nickname);
            const isAdmin = !!matchedUser?.isAdmin;
            const avatarText = message.nickname?.slice(0, 1) || '客';
            return (
              <div key={message.id} className={`chatroom-message-item ${isSelf ? 'self' : 'other'}`}>
                <div className="chatroom-message-row">
                  {!isSelf && (
                    <div className="chatroom-message-avatar" aria-hidden>{avatarText}</div>
                  )}
                  <div className="chatroom-message-bubble">
                    <div className="chatroom-message-header">
                      <span className="chatroom-message-nickname">
                        {message.nickname}
                        {isAdmin && <span className="chatroom-admin-badge" title="管理员">🛡️ 管理员</span>}
                      </span>
                      <span className="chatroom-message-time">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {state.currentUser?.isAdmin && (
                        <button
                          className="chatroom-message-delete"
                          title="删除该消息（管理员）"
                          onClick={async () => {
                            if (!state.currentUser) return;
                            if (!confirm('确定要删除这条消息吗？')) return;
                            try {
                              await deleteMessage(message.id, state.currentUser.id);
                              await refreshMessages();
                            } catch (e) {
                              alert(e instanceof Error ? e.message : '删除失败');
                            }
                          }}
                        >
                          删除
                        </button>
                      )}
                    </div>
                    <div className="chatroom-message-content">
                      {message.content}
                    </div>
                  </div>
                  {isSelf && (
                    <div className="chatroom-message-avatar self" aria-hidden>{avatarText}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        {showScrollToBottom && (
          <button className="chatroom-scroll-bottom" onClick={scrollToBottom} title="回到底部">↓</button>
        )}
      </div>

      {/* 输入区域 */}
      {state.currentUser && (
        <div className="chatroom-chat-input-area" style={keyboardOffset ? { paddingBottom: `${keyboardOffset + 12}px` } : undefined}>
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
              onFocus={() => {
                // 输入框聚焦时，滚动到底部，避免被键盘遮挡
                setTimeout(() => {
                  scrollToBottom();
                  inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }, 50);
              }}
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
