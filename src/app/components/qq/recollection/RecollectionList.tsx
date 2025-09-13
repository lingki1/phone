'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { dataManager } from '../../../utils/dataManager';
import { WorldBook } from '../../../types/chat';
import { useI18n } from '../../i18n/I18nProvider';
import './RecollectionList.css';

interface RecollectionListProps {
  onSelectRecollection: (recollection: WorldBook) => void;
}

export default function RecollectionList({ onSelectRecollection }: RecollectionListProps) {
  const { t, locale } = useI18n();
  const [recollections, setRecollections] = useState<WorldBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 加载回忆条目
  const loadRecollections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // 获取所有世界书条目
      const allWorldBooks = await dataManager.getAllWorldBooks();
      
      // 筛选recollection分类的条目
      const recollectionItems = allWorldBooks.filter(item => 
        item.category === 'recollection'
      );
      
      // 按创建时间倒序排列（最新的在前）
      const sortedRecollections = recollectionItems.sort((a, b) => 
        (b.createdAt || 0) - (a.createdAt || 0)
      );
      
      setRecollections(sortedRecollections);
      console.log(t('QQ.ChatInterface.Recollection.RecollectionList.logs.loaded', '加载回忆条目: {{count}} 条').replace('{{count}}', sortedRecollections.length.toString()));
    } catch (error) {
      console.error(t('QQ.ChatInterface.Recollection.RecollectionList.errors.loadFailed', '加载回忆条目失败:'), error);
      setError(t('QQ.ChatInterface.Recollection.RecollectionList.errors.loadFailedRetry', '加载回忆条目失败，请重试'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // 组件挂载时加载数据
  useEffect(() => {
    loadRecollections();
  }, [loadRecollections]);

  // 格式化日期
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(locale || 'zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [locale]);

  // 保留备用方法，当前未使用，以下划线前缀避免告警
  const _extractChatName = useCallback((title: string) => {
    const match = title.match(/^(.+?) - /);
    return match ? match[1] : t('QQ.ChatInterface.Recollection.RecollectionList.unknown', '未知');
  }, [t]);

  // 截取内容预览
  const getContentPreview = useCallback((content: string, maxLength: number = 100) => {
    // 移除HTML标签和Markdown标记，只保留纯文本
    const plainText = content
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/[#*`_~\[\]()]/g, '') // 移除Markdown标记
      .replace(/\n+/g, ' ') // 将换行符替换为空格
      .trim();
    
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }, []);

  // 删除回忆条目
  const handleDelete = useCallback(async (recollectionId: string) => {
    if (!recollectionId) {
      alert(t('QQ.ChatInterface.Recollection.RecollectionList.errors.cannotDelete', '无法删除：缺少条目ID'));
      return;
    }

    setDeletingId(recollectionId);
    try {
      // 从世界书删除条目
      await dataManager.deleteWorldBook(recollectionId);
      console.log(t('QQ.ChatInterface.Recollection.RecollectionList.logs.deleted', '回忆条目已删除:'), recollectionId);
      
      // 从本地状态中移除
      setRecollections(prev => prev.filter(item => item.id !== recollectionId));
      
      // 显示成功消息
      alert(t('QQ.ChatInterface.Recollection.RecollectionList.success.deleted', '回忆条目已删除'));
    } catch (error) {
      console.error(t('QQ.ChatInterface.Recollection.RecollectionList.errors.deleteFailed', '删除回忆条目失败:'), error);
      alert(t('QQ.ChatInterface.Recollection.RecollectionList.errors.deleteFailedRetry', '删除失败，请重试'));
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  }, [t]);

  // 显示删除确认
  const showDeleteConfirmation = useCallback((recollectionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止触发父元素的点击事件
    setShowDeleteConfirm(recollectionId);
  }, []);

  // 取消删除
  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(null);
  }, []);

  if (isLoading) {
    return (
      <div className="recollection-list-loading">
        <div className="recollection-spinner"></div>
        <p>{t('QQ.ChatInterface.Recollection.RecollectionList.loading', '加载回忆中...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recollection-list-error">
        <p>{error}</p>
        <button 
          className="recollection-retry-btn"
          onClick={loadRecollections}
        >
          {t('QQ.ChatInterface.Recollection.RecollectionList.retry', '重新加载')}
        </button>
      </div>
    );
  }

  if (recollections.length === 0) {
    return (
      <div className="recollection-list-empty">
        <div className="recollection-empty-icon">📚</div>
        <h3>{t('QQ.ChatInterface.Recollection.RecollectionList.empty.title', '暂无回忆记录')}</h3>
        <p>{t('QQ.ChatInterface.Recollection.RecollectionList.empty.description', '还没有生成过记忆总结，快去聊天界面生成您的第一份回忆吧！')}</p>
      </div>
    );
  }

  return (
    <div className="recollection-list">
      <div className="recollection-list-content">
        {recollections.map((recollection) => (
          <div 
            key={recollection.id}
            className="recollection-item"
            onClick={() => onSelectRecollection(recollection)}
          >
            <div className="recollection-item-header">
              <div className="recollection-chat-info">
                <div className="recollection-chat-details">
                  <h3 className="recollection-chat-name">
                    {recollection.name || t('QQ.ChatInterface.Recollection.RecollectionList.unknown', '未知')}
                  </h3>
                  <p className="recollection-chat-date">
                    {formatDate(recollection.createdAt || Date.now())}
                  </p>
                </div>
              </div>
              <div className="recollection-item-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </div>
            </div>
            
            <div className="recollection-item-content">
              <p className="recollection-preview">
                {getContentPreview(recollection.content || '', 120)}
              </p>
            </div>
            
            <div className="recollection-item-footer">
              <div className="recollection-tags">
                {(recollection as WorldBook & { tags?: string[] }).tags?.slice(0, 3).map((tag, index) => (
                  <span key={index} className="recollection-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="recollection-meta">
                {(recollection as WorldBook & { metadata?: { messageCount?: number } }).metadata?.messageCount && (
                  <span className="recollection-meta-item">
                    📝 {t('QQ.ChatInterface.Recollection.RecollectionList.messageCount', '{{count}} 条消息').replace('{{count}}', String((recollection as WorldBook & { metadata?: { messageCount?: number } }).metadata?.messageCount || 0))}
                  </span>
                )}
                <button 
                  className="recollection-delete-btn"
                  onClick={(e) => showDeleteConfirmation(recollection.id, e)}
                  disabled={deletingId === recollection.id}
                  title={t('QQ.ChatInterface.Recollection.RecollectionList.delete.title', '删除回忆')}
                >
                  {deletingId === recollection.id ? (
                    <div className="recollection-delete-spinner"></div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 删除确认模态框 */}
      {showDeleteConfirm && (
        <div className="recollection-delete-modal">
          <div className="recollection-modal-overlay" onClick={cancelDelete}></div>
          <div className="recollection-modal-content">
            <div className="recollection-modal-header">
              <h3>{t('QQ.ChatInterface.Recollection.RecollectionList.confirm.title', '确认删除')}</h3>
              <button className="recollection-modal-close" onClick={cancelDelete}>×</button>
            </div>
            
            <div className="recollection-modal-body">
              <div className="recollection-delete-warning">
                <div className="recollection-warning-icon">⚠️</div>
                <h4>{t('QQ.ChatInterface.Recollection.RecollectionList.confirm.question', '确定要删除这条回忆吗？')}</h4>
                <p>{t('QQ.ChatInterface.Recollection.RecollectionList.confirm.warning', '删除后将无法恢复，此操作会同时从世界书中移除该条目。')}</p>
                {(() => {
                  const recollection = recollections.find(r => r.id === showDeleteConfirm);
                  return recollection ? (
                    <div className="recollection-delete-info">
                      <p><strong>{t('QQ.ChatInterface.Recollection.RecollectionList.confirm.titleLabel', '回忆标题：')}</strong>{recollection.name}</p>
                      <p><strong>{t('QQ.ChatInterface.Recollection.RecollectionList.confirm.createdAtLabel', '创建时间：')}</strong>{formatDate(recollection.createdAt || Date.now())}</p>
                    </div>
                  ) : null;
                })()}
              </div>
              
              <div className="recollection-modal-actions">
                <button 
                  className="recollection-cancel-btn"
                  onClick={cancelDelete}
                  disabled={deletingId === showDeleteConfirm}
                >
                  {t('QQ.ChatInterface.Recollection.RecollectionList.confirm.cancel', '取消')}
                </button>
                <button 
                  className="recollection-confirm-delete-btn"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deletingId === showDeleteConfirm}
                >
                  {deletingId === showDeleteConfirm ? t('QQ.ChatInterface.Recollection.RecollectionList.confirm.deleting', '删除中...') : t('QQ.ChatInterface.Recollection.RecollectionList.confirm.confirm', '确认删除')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
