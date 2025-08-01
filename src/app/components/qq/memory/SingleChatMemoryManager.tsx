'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChatItem, Message } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './SingleChatMemoryManager.css';

interface SingleChatMemoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatItem; // 当前单聊
  onUpdateChat: (chat: ChatItem) => void;
  availableContacts: ChatItem[];
}

interface GroupMemoryStatus {
  groupChatId: string;
  groupChatName: string;
  groupChatAvatar: string;
  memoryCount: number;
  lastUpdated: number | null;
  isLinked: boolean;
  linkedGroupChatId?: string;
}

export default function SingleChatMemoryManager({
  isOpen,
  onClose,
  chat,
  onUpdateChat,
  availableContacts
}: SingleChatMemoryManagerProps) {
  const [groupMemoryStatus, setGroupMemoryStatus] = useState<GroupMemoryStatus[]>([]);
  const [selectedGroupChat, setSelectedGroupChat] = useState<ChatItem | null>(null);
  const [showMemoryPreview, setShowMemoryPreview] = useState(false);
  const [memoryPreview, setMemoryPreview] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const initializeGroupMemoryStatus = useCallback(async () => {
    // 获取所有群聊
    const groupChats = availableContacts.filter(contact => contact.isGroup);
    
    console.log('检测到的群聊数量:', groupChats.length);
    console.log('当前单聊名称:', chat.name);
    
    const status: GroupMemoryStatus[] = [];
    
    for (const groupChat of groupChats) {
      console.log('检查群聊:', groupChat.name, '成员:', groupChat.members?.map(m => m.originalName));
      
      // 检查当前单聊是否已经链接了这个群聊的记忆
      const isLinked = chat.settings.linkedGroupChatIds?.includes(groupChat.id) || false;
      
      // 获取群聊中所有人的消息数量（不仅仅是当前AI角色的消息）
      let memoryCount = 0;
      let lastUpdated = null;
      
      if (groupChat.messages) {
        // 计算群聊中所有人的消息数量
        memoryCount = groupChat.messages.length;
        if (groupChat.messages.length > 0) {
          lastUpdated = groupChat.messages[groupChat.messages.length - 1].timestamp;
        }
      }
      
      // 无论是否找到AI成员，都显示群聊（但标记为无记忆）
      status.push({
        groupChatId: groupChat.id,
        groupChatName: groupChat.name,
        groupChatAvatar: groupChat.avatar,
        memoryCount,
        lastUpdated,
        isLinked,
        linkedGroupChatId: isLinked ? groupChat.id : undefined
      });
    }
    
    console.log('最终状态:', status);
    setGroupMemoryStatus(status);
  }, [chat, availableContacts]);

  // 初始化群聊记忆状态
  useEffect(() => {
    if (isOpen) {
      initializeGroupMemoryStatus();
    }
  }, [isOpen, initializeGroupMemoryStatus]);

  // 链接群聊记忆
  const linkGroupChatMemory = async (groupChatId: string) => {
    setIsLoading(true);
    try {
      // 获取群聊数据
      const groupChat = availableContacts.find(chat => chat.id === groupChatId);
      if (!groupChat) {
        throw new Error('群聊不存在');
      }

      // 更新单聊设置，添加群聊记忆链接
      const updatedLinkedGroupChatIds = [
        ...(chat.settings.linkedGroupChatIds || []),
        groupChatId
      ];

      const updatedChat = {
        ...chat,
        settings: {
          ...chat.settings,
          linkedGroupChatIds: updatedLinkedGroupChatIds
        }
      };

      onUpdateChat(updatedChat);
      
      // 重新初始化记忆状态
      await initializeGroupMemoryStatus();
      
      console.log(`已链接群聊 ${groupChat.name} 的记忆到单聊`);
    } catch (error) {
      console.error('链接群聊记忆失败:', error);
      alert('链接失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 取消链接群聊记忆
  const unlinkGroupChatMemory = async (groupChatId: string) => {
    setIsLoading(true);
    try {
      // 更新单聊设置，移除群聊记忆链接
      const updatedLinkedGroupChatIds = (chat.settings.linkedGroupChatIds || [])
        .filter(id => id !== groupChatId);

      const updatedChat = {
        ...chat,
        settings: {
          ...chat.settings,
          linkedGroupChatIds: updatedLinkedGroupChatIds
        }
      };

      onUpdateChat(updatedChat);
      
      // 重新初始化记忆状态
      await initializeGroupMemoryStatus();
      
      console.log('已取消链接群聊记忆');
    } catch (error) {
      console.error('取消链接失败:', error);
      alert('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 预览群聊记忆
  const previewGroupChatMemory = async (groupChatId: string) => {
    const groupChat = availableContacts.find(chat => chat.id === groupChatId);
    if (!groupChat) return;

    setSelectedGroupChat(groupChat);
    
    if (groupChat.messages) {
      // 显示群聊中所有人的消息
      setMemoryPreview(groupChat.messages);
      setShowMemoryPreview(true);
    }
  };

  // 刷新群聊记忆
  const refreshGroupChatMemory = async (groupChatId: string) => {
    setIsLoading(true);
    try {
      // 从数据库重新获取群聊数据
      const groupChat = await dataManager.getChat(groupChatId);
      if (!groupChat) {
        throw new Error('群聊不存在');
      }

      // 重新初始化记忆状态
      await initializeGroupMemoryStatus();
      
      console.log(`已刷新群聊 ${groupChat.name} 的记忆`);
    } catch (error) {
      console.error('刷新群聊记忆失败:', error);
      alert('刷新失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', { 
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="single-chat-memory-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>单聊群聊记忆管理</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="memory-info">
            <p>为单聊中的AI角色链接对应的群聊记忆，让AI在单聊中了解你在群聊中的表现和关系。</p>
          </div>

          <div className="memory-list">
            {groupMemoryStatus.map(status => (
              <div key={status.groupChatId} className="memory-item">
                <div className="group-info">
                  <Image 
                    src={status.groupChatAvatar}
                    alt={status.groupChatName}
                    width={40}
                    height={40}
                    className="group-avatar"
                  />
                  <div className="group-details">
                    <div className="group-name">{status.groupChatName}</div>
                                         <div className="group-memory-info">
                       {status.memoryCount > 0 ? (
                         <span className="memory-count">{status.memoryCount} 条群聊消息</span>
                       ) : (
                         <span className="no-memory">群聊中暂无消息</span>
                       )}
                     </div>
                  </div>
                </div>

                <div className="memory-status">
                  {status.isLinked ? (
                    <div className="linked-status">
                      <span className="status-badge linked">已链接</span>
                      {status.lastUpdated && (
                        <span className="last-updated">
                          最后更新: {formatTime(status.lastUpdated)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="unlinked-status">
                      <span className="status-badge unlinked">未链接</span>
                      <span className="no-memory">未关联群聊记忆</span>
                    </div>
                  )}
                </div>

                <div className="memory-actions">
                  {status.isLinked ? (
                    <>
                      <button 
                        className="action-btn preview-btn"
                        onClick={() => previewGroupChatMemory(status.groupChatId)}
                        title="预览群聊记忆"
                      >
                        👁️ 预览
                      </button>
                      <button 
                        className="action-btn refresh-btn"
                        onClick={() => refreshGroupChatMemory(status.groupChatId)}
                        disabled={isLoading}
                        title="刷新群聊记忆"
                      >
                        🔄 刷新
                      </button>
                      <button 
                        className="action-btn unlink-btn"
                        onClick={() => unlinkGroupChatMemory(status.groupChatId)}
                        disabled={isLoading}
                        title="取消链接"
                      >
                        🔗 取消链接
                      </button>
                    </>
                  ) : (
                                         <button 
                       className="action-btn link-btn"
                       onClick={() => linkGroupChatMemory(status.groupChatId)}
                       disabled={isLoading}
                       title="链接群聊记忆"
                     >
                       🔗 链接记忆
                     </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {groupMemoryStatus.length === 0 && (
            <div className="no-groups">
              <p>暂无可用的群聊</p>
            </div>
          )}
        </div>

        {/* 群聊记忆预览模态框 */}
        {showMemoryPreview && selectedGroupChat && (
          <div className="memory-preview-modal">
            <div className="preview-header">
              <h3>{selectedGroupChat.name} 中的群聊记忆</h3>
              <button className="close-btn" onClick={() => setShowMemoryPreview(false)}>×</button>
            </div>
            <div className="preview-content">
                             {memoryPreview.length === 0 ? (
                 <div className="no-memory">群聊中暂无消息</div>
               ) : (
                <div className="memory-messages">
                                     {memoryPreview.slice(-20).map((msg, index) => (
                     <div key={index} className={`memory-message ${msg.role}`}>
                       <div className="message-sender">
                         {msg.role === 'user' ? '我' : msg.senderName || chat.name}
                       </div>
                      <div className="message-content">
                        {msg.content.length > 100 
                          ? msg.content.substring(0, 100) + '...' 
                          : msg.content
                        }
                      </div>
                      <div className="message-time">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 