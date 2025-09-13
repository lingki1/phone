'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChatItem } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import { MemorySyncService } from '../storymode/MemorySyncService';
import { useI18n } from '../../i18n/I18nProvider';
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
  storyMemoryCount: number;
  totalMemoryCount: number;
  lastUpdated: number | null;
  lastStoryUpdated: number | null;
  isLinked: boolean;
  linkedGroupChatId?: string;
  normalMessageLimit?: number;
  storyMessageLimit?: number;
}

export default function SingleChatMemoryManager({
  isOpen,
  onClose,
  chat,
  onUpdateChat,
  availableContacts
}: SingleChatMemoryManagerProps) {
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
  const [groupMemoryStatus, setGroupMemoryStatus] = useState<GroupMemoryStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_memorySyncService] = useState(() => {
    const service = MemorySyncService.getInstance();
    service.setTranslationFunction(t);
    return service;
  });
  const [showLimitSettings, setShowLimitSettings] = useState<string | null>(null);
  const [tempNormalLimit, setTempNormalLimit] = useState<number>(20);
  const [tempStoryLimit, setTempStoryLimit] = useState<number>(20);

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
      
      // 获取消息数量限制设置
      const memoryLimits = getMemoryLimits(chat.settings)[groupChat.id] || { normalMessageLimit: 20, storyMessageLimit: 20 };
      const normalMessageLimit = memoryLimits.normalMessageLimit || 20;
      const storyMessageLimit = memoryLimits.storyMessageLimit || 20;
      
      // 获取群聊中所有人的消息数量（普通聊天模式）
      let memoryCount = 0;
      let lastUpdated = null;
      
      if (groupChat.messages) {
        // 计算群聊中所有人的消息数量
        memoryCount = groupChat.messages.length;
        if (groupChat.messages.length > 0) {
          lastUpdated = groupChat.messages[groupChat.messages.length - 1].timestamp;
        }
      }
      
      // 获取剧情模式消息统计
      let storyMemoryCount = 0;
      let lastStoryUpdated = null;
      
      try {
        const storyMessages = await dataManager.getStoryModeMessages(groupChat.id);
        storyMemoryCount = storyMessages.length;
        if (storyMessages.length > 0) {
          lastStoryUpdated = storyMessages[storyMessages.length - 1].timestamp;
        }
      } catch (error) {
        console.warn('获取群聊剧情模式消息失败:', error);
      }
      
      const totalMemoryCount = memoryCount + storyMemoryCount;
      
      // 无论是否找到AI成员，都显示群聊（但标记为无记忆）
      status.push({
        groupChatId: groupChat.id,
        groupChatName: groupChat.name,
        groupChatAvatar: groupChat.avatar,
        memoryCount,
        storyMemoryCount,
        totalMemoryCount,
        lastUpdated,
        lastStoryUpdated,
        isLinked,
        linkedGroupChatId: isLinked ? groupChat.id : undefined,
        normalMessageLimit,
        storyMessageLimit
      });
    }
    
    console.log('最终状态:', status);
    setGroupMemoryStatus(status);
  }, [chat, availableContacts, getMemoryLimits]);

  // 初始化群聊记忆状态
  useEffect(() => {
    if (isOpen) {
      initializeGroupMemoryStatus();
    }
  }, [isOpen, initializeGroupMemoryStatus]);

  // 链接群聊记忆
  const linkGroupChatMemory = async (groupChatId: string, normalLimit?: number, storyLimit?: number) => {
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

      // 更新消息数量限制设置
      const updatedMemoryLimits: MemoryLimitsMap = {
        ...getMemoryLimits(chat.settings),
        [groupChatId]: {
          normalMessageLimit: normalLimit || 20,
          storyMessageLimit: storyLimit || 20
        }
      };

      const updatedChat = {
        ...chat,
        settings: {
          ...chat.settings,
          linkedGroupChatIds: updatedLinkedGroupChatIds,
          memoryLimits: updatedMemoryLimits
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

      // 移除消息数量限制设置
      const updatedMemoryLimits: MemoryLimitsMap = { ...getMemoryLimits(chat.settings) };
      delete updatedMemoryLimits[groupChatId];

      const updatedChat = {
        ...chat,
        settings: {
          ...chat.settings,
          linkedGroupChatIds: updatedLinkedGroupChatIds,
          memoryLimits: updatedMemoryLimits
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

  // 更新消息数量限制
  const updateMemoryLimits = async (groupChatId: string, normalLimit: number, storyLimit: number) => {
    setIsLoading(true);
    try {
      const updatedMemoryLimits: MemoryLimitsMap = {
        ...getMemoryLimits(chat.settings),
        [groupChatId]: {
          normalMessageLimit: normalLimit,
          storyMessageLimit: storyLimit
        }
      };

      const updatedChat = {
        ...chat,
        settings: {
          ...chat.settings,
          memoryLimits: updatedMemoryLimits
        }
      };

      onUpdateChat(updatedChat);
      
      // 重新初始化记忆状态
      await initializeGroupMemoryStatus();
      
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
  const showLimitSettingsModal = (groupChatId: string) => {
    const status = groupMemoryStatus.find(s => s.groupChatId === groupChatId);
    if (status) {
      setTempNormalLimit(status.normalMessageLimit || 20);
      setTempStoryLimit(status.storyMessageLimit || 20);
      setShowLimitSettings(groupChatId);
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
    return date.toLocaleString(locale || 'zh-CN', { 
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
          <h2>{t('QQ.ChatInterface.SingleChatMemoryManager.title', '单聊群聊记忆管理')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="memory-info">
            <p>{t('QQ.ChatInterface.SingleChatMemoryManager.info', '为单聊中的AI角色链接对应的群聊记忆，让AI在单聊中了解你在群聊中的表现和关系。')}</p>
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
                      {status.totalMemoryCount > 0 ? (
                        <div className="memory-stats">
                          <span className="memory-count">
                            {t('QQ.ChatInterface.SingleChatMemoryManager.count.total', '总计 {{count}} 条消息').replace('{{count}}', String(status.totalMemoryCount))}
                          </span>
                          <div className="memory-breakdown">
                            {status.memoryCount > 0 && (
                              <span className="normal-memory">{t('QQ.ChatInterface.SingleChatMemoryManager.count.normal', '💬 {{count}} 条聊天').replace('{{count}}', String(status.memoryCount))}</span>
                            )}
                            {status.storyMemoryCount > 0 && (
                              <span className="story-memory">{t('QQ.ChatInterface.SingleChatMemoryManager.count.story', '📖 {{count}} 条剧情').replace('{{count}}', String(status.storyMemoryCount))}</span>
                            )}
                          </div>
                          {status.isLinked && (
                            <div className="memory-limits">
                              <span className="limit-info">
                                {t('QQ.ChatInterface.SingleChatMemoryManager.limits', '限制: 聊天{{normal}}条, 剧情{{story}}条')
                                  .replace('{{normal}}', String(status.normalMessageLimit || 0))
                                  .replace('{{story}}', String(status.storyMessageLimit || 0))}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="no-memory">群聊中暂无消息</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="memory-status">
                  {status.isLinked ? (
                    <div className="linked-status">
                      <span className="status-badge linked">{t('QQ.ChatInterface.SingleChatMemoryManager.status.linked', '已链接')}</span>
                      {status.lastUpdated && (
                        <span className="last-updated">
                          最后更新: {formatTime(status.lastUpdated)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="unlinked-status">
                      <span className="status-badge unlinked">{t('QQ.ChatInterface.SingleChatMemoryManager.status.unlinked', '未链接')}</span>
                      <span className="no-memory">{t('QQ.ChatInterface.SingleChatMemoryManager.status.noGroup', '未关联群聊记忆')}</span>
                    </div>
                  )}
                </div>

                <div className="memory-actions">
                  {status.isLinked ? (
                    <>
                      <button 
                        className="action-btn settings-btn"
                        onClick={() => showLimitSettingsModal(status.groupChatId)}
                        disabled={isLoading}
                        title={t('QQ.ChatInterface.SingleChatMemoryManager.actions.settings.title', '设置消息数量限制')}
                      >
                        ⚙️ {t('QQ.ChatInterface.SingleChatMemoryManager.actions.settings.label', '设置')}
                      </button>
                      <button 
                        className="action-btn refresh-btn"
                        onClick={() => refreshGroupChatMemory(status.groupChatId)}
                        disabled={isLoading}
                        title={t('QQ.ChatInterface.SingleChatMemoryManager.actions.refresh.title', '刷新群聊记忆')}
                      >
                        🔄 {t('QQ.ChatInterface.SingleChatMemoryManager.actions.refresh.label', '刷新')}
                      </button>
                      <button 
                        className="action-btn unlink-btn"
                        onClick={() => unlinkGroupChatMemory(status.groupChatId)}
                        disabled={isLoading}
                        title={t('QQ.ChatInterface.SingleChatMemoryManager.actions.unlink.title', '取消链接')}
                      >
                        🔗 {t('QQ.ChatInterface.SingleChatMemoryManager.actions.unlink.label', '取消链接')}
                      </button>
                    </>
                  ) : (
                    <button 
                      className="action-btn link-btn"
                      onClick={() => showLimitSettingsModal(status.groupChatId)}
                      disabled={isLoading}
                      title={t('QQ.ChatInterface.SingleChatMemoryManager.actions.link.title', '链接群聊记忆并设置数量限制')}
                    >
                      🔗 {t('QQ.ChatInterface.SingleChatMemoryManager.actions.link.label', '链接记忆')}
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
      </div>

      {/* 消息数量限制设置模态框 - 独立弹窗 */}
      {showLimitSettings && (
        <div className="limit-settings-overlay" onClick={() => setShowLimitSettings(null)}>
          <div className="limit-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h3>{t('QQ.ChatInterface.SingleChatMemoryManager.limitModal.title', '设置消息数量限制')}</h3>
              <button className="close-btn" onClick={() => setShowLimitSettings(null)}>×</button>
            </div>
            <div className="settings-content">
              <div className="limit-input-group">
                <label htmlFor="normalLimit">{t('QQ.ChatInterface.SingleChatMemoryManager.limitModal.normalLabel', '普通聊天消息数量:')}</label>
                <input
                  id="normalLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={tempNormalLimit}
                  onChange={(e) => setTempNormalLimit(parseInt(e.target.value) || 20)}
                  className="limit-input"
                />
                <span className="limit-hint">{t('QQ.ChatInterface.SingleChatMemoryManager.limitModal.hint', '条 (最多100条)')}</span>
              </div>
              <div className="limit-input-group">
                <label htmlFor="storyLimit">{t('QQ.ChatInterface.SingleChatMemoryManager.limitModal.storyLabel', '剧情模式消息数量:')}</label>
                <input
                  id="storyLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={tempStoryLimit}
                  onChange={(e) => setTempStoryLimit(parseInt(e.target.value) || 20)}
                  className="limit-input"
                />
                <span className="limit-hint">{t('QQ.ChatInterface.SingleChatMemoryManager.limitModal.hint', '条 (最多100条)')}</span>
              </div>
              <div className="settings-actions">
                <button 
                  className="save-btn"
                  onClick={() => {
                    if (groupMemoryStatus.find(s => s.groupChatId === showLimitSettings)?.isLinked) {
                      // 已链接，更新设置
                      updateMemoryLimits(showLimitSettings, tempNormalLimit, tempStoryLimit);
                    } else {
                      // 未链接，链接并设置
                      linkGroupChatMemory(showLimitSettings, tempNormalLimit, tempStoryLimit);
                    }
                  }}
                  disabled={isLoading}
                >
                  {t('QQ.ChatInterface.SingleChatMemoryManager.limitModal.save', '保存设置')}
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowLimitSettings(null)}
                >
                  {t('QQ.ChatInterface.SingleChatMemoryManager.limitModal.cancel', '取消')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 