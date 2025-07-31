'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChatItem, GroupMember, Message } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './MemoryManager.css';

interface MemoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatItem;
  onUpdateChat: (chat: ChatItem) => void;
  availableContacts: ChatItem[];
}

interface MemoryStatus {
  memberId: string;
  memberName: string;
  singleChatId: string | null;
  singleChatName: string | null;
  memoryCount: number;
  lastUpdated: number | null;
  isLinked: boolean;
}

export default function MemoryManager({
  isOpen,
  onClose,
  chat,
  onUpdateChat,
  availableContacts
}: MemoryManagerProps) {
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus[]>([]);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [showMemoryPreview, setShowMemoryPreview] = useState(false);
  const [memoryPreview, setMemoryPreview] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const initializeMemoryStatus = useCallback(async () => {
    if (!chat.members) return;

    const status: MemoryStatus[] = [];
    
    for (const member of chat.members) {
      if (member.id === 'me') continue; // 跳过用户自己
      
      // 查找对应的单聊
      const singleChat = availableContacts.find(contact => 
        !contact.isGroup && contact.name === member.originalName
      );
      
      // 检查群成员是否已经链接了单聊记忆
      const isLinked = !!member.singleChatId || !!member.singleChatMemory;
      const singleChatId = member.singleChatId || singleChat?.id || null;
      const singleChatName = singleChat?.name || null;
      
      // 获取单聊记忆数量
      let memoryCount = 0;
      let lastUpdated = null;
      
      if (isLinked) {
        // 如果已链接，使用实际的记忆数据
        if (member.singleChatMemory) {
          memoryCount = member.singleChatMemory.length;
          if (member.singleChatMemory.length > 0) {
            lastUpdated = member.singleChatMemory[member.singleChatMemory.length - 1].timestamp;
          }
        } else if (singleChat) {
          memoryCount = singleChat.messages.length;
          if (singleChat.messages.length > 0) {
            lastUpdated = singleChat.messages[singleChat.messages.length - 1].timestamp;
          }
        }
      } else if (singleChat) {
        // 如果未链接但有对应的单聊，显示单聊的数据
        memoryCount = singleChat.messages.length;
        if (singleChat.messages.length > 0) {
          lastUpdated = singleChat.messages[singleChat.messages.length - 1].timestamp;
        }
      }
      
      status.push({
        memberId: member.id,
        memberName: member.groupNickname,
        singleChatId,
        singleChatName,
        memoryCount,
        lastUpdated,
        isLinked
      });
    }
    
    setMemoryStatus(status);
  }, [chat.members, availableContacts]);

  // 初始化记忆状态
  useEffect(() => {
    if (isOpen && chat.members) {
      initializeMemoryStatus();
    }
  }, [isOpen, initializeMemoryStatus, chat.members]);

  // 链接单聊记忆
  const linkSingleChatMemory = async (memberId: string, singleChatId: string) => {
    if (!chat.members) return;

    setIsLoading(true);
    try {
      // 获取单聊数据
      const singleChat = availableContacts.find(chat => chat.id === singleChatId);
      if (!singleChat) {
        throw new Error('单聊不存在');
      }

      // 更新群成员信息
      const updatedMembers = chat.members.map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            singleChatId: singleChatId,
            singleChatMemory: singleChat.messages
          };
        }
        return member;
      });

      // 更新群聊
      const updatedChat = {
        ...chat,
        members: updatedMembers
      };

      onUpdateChat(updatedChat);
      
      // 重新初始化记忆状态
      await initializeMemoryStatus();
      
      console.log(`已链接 ${singleChat.name} 的单聊记忆到群聊`);
    } catch (error) {
      console.error('链接单聊记忆失败:', error);
      alert('链接失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 取消链接单聊记忆
  const unlinkSingleChatMemory = async (memberId: string) => {
    if (!chat.members) return;

    setIsLoading(true);
    try {
      // 更新群成员信息
      const updatedMembers = chat.members.map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            singleChatId: undefined,
            singleChatMemory: undefined
          };
        }
        return member;
      });

      // 更新群聊
      const updatedChat = {
        ...chat,
        members: updatedMembers
      };

      onUpdateChat(updatedChat);
      
      // 重新初始化记忆状态
      await initializeMemoryStatus();
      
      console.log('已取消链接单聊记忆');
    } catch (error) {
      console.error('取消链接失败:', error);
      alert('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 预览单聊记忆
  const previewSingleChatMemory = async (memberId: string) => {
    const member = chat.members?.find(m => m.id === memberId);
    if (!member) return;

    setSelectedMember(member);
    
    if (member.singleChatMemory) {
      setMemoryPreview(member.singleChatMemory);
      setShowMemoryPreview(true);
    } else if (member.singleChatId) {
      // 从数据库重新获取
      try {
        const singleChat = await dataManager.getChat(member.singleChatId);
        if (singleChat) {
          setMemoryPreview(singleChat.messages);
          setShowMemoryPreview(true);
        }
      } catch (error) {
        console.error('获取单聊记忆失败:', error);
        alert('获取记忆失败');
      }
    }
  };

  // 刷新单聊记忆
  const refreshSingleChatMemory = async (memberId: string) => {
    const member = chat.members?.find(m => m.id === memberId);
    if (!member || !member.singleChatId) return;

    setIsLoading(true);
    try {
      // 从数据库重新获取单聊数据
      const singleChat = await dataManager.getChat(member.singleChatId);
      if (!singleChat) {
        throw new Error('单聊不存在');
      }

      // 更新群成员信息
      const updatedMembers = chat.members?.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            singleChatMemory: singleChat.messages
          };
        }
        return m;
      }) || [];

      // 更新群聊
      const updatedChat = {
        ...chat,
        members: updatedMembers
      };

      onUpdateChat(updatedChat);
      
      // 重新初始化记忆状态
      await initializeMemoryStatus();
      
      console.log(`已刷新 ${member.groupNickname} 的单聊记忆`);
    } catch (error) {
      console.error('刷新单聊记忆失败:', error);
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

  // 获取可用的单聊列表
  const getAvailableSingleChats = () => {
    return availableContacts.filter(contact => !contact.isGroup);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="memory-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>群聊记忆管理</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="memory-info">
            <p>为群聊中的每个AI角色链接对应的单聊记忆，让AI在群聊中保持与你的个人关系记忆。</p>
          </div>

          <div className="memory-list">
            {memoryStatus.map(status => {
              const member = chat.members?.find(m => m.id === status.memberId);
              if (!member) return null;

              return (
                <div key={status.memberId} className="memory-item">
                  <div className="member-info">
                    <Image 
                      src={member.avatar}
                      alt={member.groupNickname}
                      width={40}
                      height={40}
                      className="member-avatar"
                    />
                    <div className="member-details">
                      <div className="member-name">{member.groupNickname}</div>
                      <div className="member-persona">{member.persona}</div>
                    </div>
                  </div>

                  <div className="memory-status">
                    {status.isLinked ? (
                      <div className="linked-status">
                        <span className="status-badge linked">已链接</span>
                        <span className="memory-count">{status.memoryCount} 条记忆</span>
                        {status.lastUpdated && (
                          <span className="last-updated">
                            最后更新: {formatTime(status.lastUpdated)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="unlinked-status">
                        <span className="status-badge unlinked">未链接</span>
                        <span className="no-memory">无单聊记忆</span>
                      </div>
                    )}
                  </div>

                  <div className="memory-actions">
                    {status.isLinked ? (
                      <>
                        <button 
                          className="action-btn preview-btn"
                          onClick={() => previewSingleChatMemory(status.memberId)}
                          title="预览记忆"
                        >
                          👁️ 预览
                        </button>
                        <button 
                          className="action-btn refresh-btn"
                          onClick={() => refreshSingleChatMemory(status.memberId)}
                          disabled={isLoading}
                          title="刷新记忆"
                        >
                          🔄 刷新
                        </button>
                        <button 
                          className="action-btn unlink-btn"
                          onClick={() => unlinkSingleChatMemory(status.memberId)}
                          disabled={isLoading}
                          title="取消链接"
                        >
                          🔗 取消链接
                        </button>
                      </>
                    ) : (
                      <select 
                        className="link-select"
                        onChange={(e) => {
                          if (e.target.value) {
                            linkSingleChatMemory(status.memberId, e.target.value);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <option value="">选择单聊...</option>
                        {getAvailableSingleChats().map(singleChat => (
                          <option key={singleChat.id} value={singleChat.id}>
                            {singleChat.name} ({singleChat.messages.length} 条消息)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 记忆预览模态框 */}
        {showMemoryPreview && selectedMember && (
          <div className="memory-preview-modal">
            <div className="preview-header">
              <h3>{selectedMember.groupNickname} 的单聊记忆</h3>
              <button className="close-btn" onClick={() => setShowMemoryPreview(false)}>×</button>
            </div>
            <div className="preview-content">
              {memoryPreview.length === 0 ? (
                <div className="no-memory">暂无聊天记录</div>
              ) : (
                <div className="memory-messages">
                  {memoryPreview.slice(-20).map((msg, index) => (
                    <div key={index} className={`memory-message ${msg.role}`}>
                      <div className="message-sender">
                        {msg.role === 'user' ? '我' : selectedMember.groupNickname}
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