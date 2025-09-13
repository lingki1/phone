'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChatItem } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import { MemorySyncService } from '../storymode/MemorySyncService';
import { useI18n } from '../../i18n/I18nProvider';
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
  storyMemoryCount: number;
  totalMemoryCount: number;
  lastUpdated: number | null;
  lastStoryUpdated: number | null;
  isLinked: boolean;
  normalMessageLimit?: number;
  storyMessageLimit?: number;
}

export default function MemoryManager({
  isOpen,
  onClose,
  chat,
  onUpdateChat,
  availableContacts
}: MemoryManagerProps) {
  const { t, locale } = useI18n();
  // 辅助类型与读取函数，避免显式 any
  interface MemoryLimitConfig {
    normalMessageLimit: number;
    storyMessageLimit: number;
  }
  type MemoryLimitsMap = Record<string, MemoryLimitConfig>;

  const getMemoryLimits = useCallback((settings: unknown): MemoryLimitsMap => {
    const s = settings as { memoryLimits?: MemoryLimitsMap };
    return s.memoryLimits || {};
  }, []);
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_memorySyncService] = useState(() => {
    const service = MemorySyncService.getInstance();
    service.setTranslationFunction(t);
    return service;
  });
  const [showLimitSettings, setShowLimitSettings] = useState<string | null>(null);
  const [tempNormalLimit, setTempNormalLimit] = useState<number>(20);
  const [tempStoryLimit, setTempStoryLimit] = useState<number>(20);

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
      
      // 获取消息数量限制设置（兼容旧类型）
      const memoryLimits = getMemoryLimits(chat.settings)[singleChatId || ''] || { normalMessageLimit: 20, storyMessageLimit: 20 };
      const normalMessageLimit = memoryLimits.normalMessageLimit || 20;
      const storyMessageLimit = memoryLimits.storyMessageLimit || 20;
      
      // 获取单聊记忆数量（普通聊天模式）
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
      
      // 获取剧情模式消息统计
      let storyMemoryCount = 0;
      let lastStoryUpdated = null;
      
      if (singleChatId) {
        try {
          const storyMessages = await dataManager.getStoryModeMessages(singleChatId);
          storyMemoryCount = storyMessages.length;
          if (storyMessages.length > 0) {
            lastStoryUpdated = storyMessages[storyMessages.length - 1].timestamp;
          }
        } catch (error) {
          console.warn('获取单聊剧情模式消息失败:', error);
        }
      }
      
      const totalMemoryCount = memoryCount + storyMemoryCount;
      
      status.push({
        memberId: member.id,
        memberName: member.groupNickname,
        singleChatId,
        singleChatName,
        memoryCount,
        storyMemoryCount,
        totalMemoryCount,
        lastUpdated,
        lastStoryUpdated,
        isLinked,
        normalMessageLimit,
        storyMessageLimit
      });
    }
    
    setMemoryStatus(status);
  }, [chat.members, availableContacts, chat.settings, getMemoryLimits]);

  // 初始化记忆状态
  useEffect(() => {
    if (isOpen && chat.members) {
      initializeMemoryStatus();
    }
  }, [isOpen, initializeMemoryStatus, chat.members]);

  // 链接单聊记忆
  const _linkSingleChatMemory = async (memberId: string, singleChatId: string, normalLimit?: number, storyLimit?: number) => {
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

      // 更新消息数量限制设置
      const updatedMemoryLimits: MemoryLimitsMap = {
        ...getMemoryLimits(chat.settings),
        [singleChatId]: {
          normalMessageLimit: normalLimit || 20,
          storyMessageLimit: storyLimit || 20
        }
      };

      // 更新群聊
      const updatedChat = {
        ...chat,
        members: updatedMembers,
        settings: ({ ...chat.settings, memoryLimits: updatedMemoryLimits } as typeof chat.settings)
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
      // 获取要取消链接的成员信息
      const member = chat.members.find(m => m.id === memberId);
      const singleChatId = member?.singleChatId;

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

      // 移除消息数量限制设置
      const updatedMemoryLimits: MemoryLimitsMap = { ...getMemoryLimits(chat.settings) };
      if (singleChatId) {
        delete updatedMemoryLimits[singleChatId];
      }

      // 更新群聊
      const updatedChat = {
        ...chat,
        members: updatedMembers,
        settings: ({ ...chat.settings, memoryLimits: updatedMemoryLimits } as typeof chat.settings)
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

  // 更新消息数量限制
  const updateMemoryLimits = async (memberId: string, normalLimit: number, storyLimit: number) => {
    const member = chat.members?.find(m => m.id === memberId);
    if (!member || !member.singleChatId) return;

    setIsLoading(true);
    try {
      const updatedMemoryLimits: MemoryLimitsMap = {
        ...getMemoryLimits(chat.settings),
        [member.singleChatId]: {
          normalMessageLimit: normalLimit,
          storyMessageLimit: storyLimit
        }
      };

      const updatedChat = {
        ...chat,
        settings: ({ ...chat.settings, memoryLimits: updatedMemoryLimits } as typeof chat.settings)
      };

      onUpdateChat(updatedChat);
      
      // 重新初始化记忆状态
      await initializeMemoryStatus();
      
      setShowLimitSettings(null);
      console.log('已更新消息数量限制');
    } catch (error) {
      console.error('更新消息数量限制失败:', error);
      alert('更新失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 显示设置界面
  const showLimitSettingsModal = (memberId: string) => {
    const status = memoryStatus.find(s => s.memberId === memberId);
    if (status) {
      setTempNormalLimit(status.normalMessageLimit || 20);
      setTempStoryLimit(status.storyMessageLimit || 20);
      setShowLimitSettings(memberId);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(locale || 'zh-CN', { 
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取可用的单聊列表（暂未使用，保留示例时前缀下划线抑制告警）
  const _getAvailableSingleChats = () => {
    return availableContacts.filter(contact => !contact.isGroup);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="memory-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('QQ.ChatInterface.MemoryManager.title', '群聊记忆管理')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="memory-info">
            <p>{t('QQ.ChatInterface.MemoryManager.info', '为群聊中的每个AI角色链接对应的单聊记忆，让AI在群聊中保持与你的个人关系记忆。')}</p>
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
                        <span className="status-badge linked">{t('QQ.ChatInterface.MemoryManager.status.linked', '已链接')}</span>
                        <div className="memory-stats">
                          <span className="memory-count">{t('QQ.ChatInterface.MemoryManager.count.total', '总计 {{count}} 条记忆').replace('{{count}}', String(status.totalMemoryCount))}</span>
                          <div className="memory-breakdown">
                            {status.memoryCount > 0 && (
                              <span className="normal-memory">{t('QQ.ChatInterface.MemoryManager.count.normal', '💬 {{count}} 条聊天').replace('{{count}}', String(status.memoryCount))}</span>
                            )}
                            {status.storyMemoryCount > 0 && (
                              <span className="story-memory">{t('QQ.ChatInterface.MemoryManager.count.story', '📖 {{count}} 条剧情').replace('{{count}}', String(status.storyMemoryCount))}</span>
                            )}
                          </div>
                          <div className="memory-limits">
                            <span className="limit-info">
                              {t('QQ.ChatInterface.MemoryManager.limits', '限制: 聊天{{normal}}条, 剧情{{story}}条')
                                .replace('{{normal}}', String(status.normalMessageLimit || 0))
                                .replace('{{story}}', String(status.storyMessageLimit || 0))}
                            </span>
                          </div>
                        </div>
                        {status.lastUpdated && (
                          <span className="last-updated">
                            {t('QQ.ChatInterface.MemoryManager.lastUpdated', '最后更新: {{time}}').replace('{{time}}', formatTime(status.lastUpdated))}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="unlinked-status">
                        <span className="status-badge unlinked">{t('QQ.ChatInterface.MemoryManager.status.unlinked', '未链接')}</span>
                        {status.singleChatName ? (
                          <div className="memory-stats">
                            <span className="memory-count">{t('QQ.ChatInterface.MemoryManager.count.total', '总计 {{count}} 条记忆').replace('{{count}}', String(status.totalMemoryCount))}</span>
                            <div className="memory-breakdown">
                              {status.memoryCount > 0 && (
                                <span className="normal-memory">{t('QQ.ChatInterface.MemoryManager.count.normal', '💬 {{count}} 条聊天').replace('{{count}}', String(status.memoryCount))}</span>
                              )}
                              {status.storyMemoryCount > 0 && (
                                <span className="story-memory">{t('QQ.ChatInterface.MemoryManager.count.story', '📖 {{count}} 条剧情').replace('{{count}}', String(status.storyMemoryCount))}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="no-memory">{t('QQ.ChatInterface.MemoryManager.status.noSingle', '无单聊记忆')}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="memory-actions">
                    {status.isLinked ? (
                      <>
                        <button 
                          className="action-btn settings-btn"
                          onClick={() => showLimitSettingsModal(status.memberId)}
                          disabled={isLoading}
                          title={t('QQ.ChatInterface.MemoryManager.actions.settings.title', '设置消息数量限制')}
                        >
                          ⚙️ {t('QQ.ChatInterface.MemoryManager.actions.settings.label', '设置')}
                        </button>
                        <button 
                          className="action-btn refresh-btn"
                          onClick={() => refreshSingleChatMemory(status.memberId)}
                          disabled={isLoading}
                          title={t('QQ.ChatInterface.MemoryManager.actions.refresh.title', '刷新记忆')}
                        >
                          🔄 {t('QQ.ChatInterface.MemoryManager.actions.refresh.label', '刷新')}
                        </button>
                        <button 
                          className="action-btn unlink-btn"
                          onClick={() => unlinkSingleChatMemory(status.memberId)}
                          disabled={isLoading}
                          title={t('QQ.ChatInterface.MemoryManager.actions.unlink.title', '取消链接')}
                        >
                          🔗 {t('QQ.ChatInterface.MemoryManager.actions.unlink.label', '取消链接')}
                        </button>
                      </>
                    ) : (
                      <button 
                        className="action-btn link-btn"
                        onClick={() => showLimitSettingsModal(status.memberId)}
                        disabled={isLoading}
                        title={t('QQ.ChatInterface.MemoryManager.actions.link.title', '链接记忆并设置数量限制')}
                      >
                        🔗 {t('QQ.ChatInterface.MemoryManager.actions.link.label', '链接记忆')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 消息数量限制设置模态框 - 独立弹窗 */}
      {showLimitSettings && (
        <div className="limit-settings-overlay" onClick={() => setShowLimitSettings(null)}>
          <div className="limit-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h3>{t('QQ.ChatInterface.MemoryManager.limitModal.title', '设置消息数量限制')}</h3>
              <button className="close-btn" onClick={() => setShowLimitSettings(null)}>×</button>
            </div>
            <div className="settings-content">
              <div className="limit-input-group">
                <label htmlFor="normalLimit">{t('QQ.ChatInterface.MemoryManager.limitModal.normalLabel', '普通聊天消息数量:')}</label>
                <input
                  id="normalLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={tempNormalLimit}
                  onChange={(e) => setTempNormalLimit(parseInt(e.target.value) || 20)}
                  className="limit-input"
                />
                <span className="limit-hint">{t('QQ.ChatInterface.MemoryManager.limitModal.hint', '条 (最多100条)')}</span>
              </div>
              <div className="limit-input-group">
                <label htmlFor="storyLimit">{t('QQ.ChatInterface.MemoryManager.limitModal.storyLabel', '剧情模式消息数量:')}</label>
                <input
                  id="storyLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={tempStoryLimit}
                  onChange={(e) => setTempStoryLimit(parseInt(e.target.value) || 20)}
                  className="limit-input"
                />
                <span className="limit-hint">{t('QQ.ChatInterface.MemoryManager.limitModal.hint', '条 (最多100条)')}</span>
              </div>
              <div className="settings-actions">
                <button 
                  className="save-btn"
                  onClick={() => {
                    const status = memoryStatus.find(s => s.memberId === showLimitSettings);
                    if (status?.isLinked) {
                      // 已链接，更新设置
                      updateMemoryLimits(showLimitSettings, tempNormalLimit, tempStoryLimit);
                    } else {
                      // 未链接，需要先选择单聊
                      alert(t('QQ.ChatInterface.MemoryManager.limitModal.alertPickSingle', '请先选择要链接的单聊'));
                    }
                  }}
                  disabled={isLoading}
                >
                  {t('QQ.ChatInterface.MemoryManager.limitModal.save', '保存设置')}
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowLimitSettings(null)}
                >
                  {t('QQ.ChatInterface.MemoryManager.limitModal.cancel', '取消')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 