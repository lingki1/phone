'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, ChatItem } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './MessagePaginationManager.css';
import { useI18n } from '../../i18n/I18nProvider';

interface MessagePaginationManagerProps {
  chat: ChatItem;
  onLoadMoreMessages: (messages: Message[]) => void;
  onUpdateScrollPosition: (oldHeight: number, newHeight: number) => void;
  isEnabled?: boolean;
  displayedMessages?: Message[]; // 新增：当前显示的消息
  messagesContainerRef?: React.RefObject<HTMLDivElement | null>; // 新增：消息容器引用
}

interface PaginationState {
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;
  pageSize: number;
  totalLoaded: number;
}

export default function MessagePaginationManager({
  chat,
  onLoadMoreMessages,
  onUpdateScrollPosition,
  isEnabled = true,
  displayedMessages = [],
  messagesContainerRef
}: MessagePaginationManagerProps) {
  const { t } = useI18n();
  const [paginationState, setPaginationState] = useState<PaginationState>({
    isLoading: false,
    hasMore: true,
    currentPage: 0,
    pageSize: 20, // 每次加载20条消息
    totalLoaded: 0
  });

  // 自动加载与观察器已禁用，避免未使用变量
  const scrollPositionRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);

  // 初始化分页状态
  useEffect(() => {
    if (!isEnabled) return;

    const initializePagination = async () => {
      try {
        await dataManager.initDB();
        
        // 检查是否真的有更早的消息可以加载
        if (displayedMessages.length > 0) {
          const oldestMessageTimestamp = Math.min(...displayedMessages.map(msg => msg.timestamp));
          const olderMessages = await dataManager.getChatMessagesBefore(
            chat.id,
            oldestMessageTimestamp,
            1 // 只检查是否有1条更早的消息
          );
          
          console.log('Pagination initialized:', {
            totalMessages: chat.messages.length,
            displayedMessages: displayedMessages.length,
            oldestTimestamp: oldestMessageTimestamp,
            hasOlderMessages: olderMessages.length > 0,
            hasMore: olderMessages.length > 0
          });
          
          setPaginationState(prev => ({
            ...prev,
            hasMore: olderMessages.length > 0,
            totalLoaded: displayedMessages.length
          }));
        } else {
          // 如果没有显示的消息，检查数据库中是否有消息
          const totalMessages = await dataManager.getChatMessageCount(chat.id);
          console.log('Pagination initialized (no displayed messages):', {
            totalMessages,
            hasMore: totalMessages > 0
          });
          
          setPaginationState(prev => ({
            ...prev,
            hasMore: totalMessages > 0,
            totalLoaded: 0
          }));
        }
        
      } catch (error) {
        console.error('Failed to initialize pagination:', error);
      }
    };

    initializePagination();
  }, [chat.id, chat.messages.length, displayedMessages.length, displayedMessages, isEnabled]);

  // 加载更多历史消息
  const loadMoreMessages = useCallback(async () => {
    if (paginationState.isLoading || !paginationState.hasMore || !isEnabled) {
      console.log('Load more blocked:', {
        isLoading: paginationState.isLoading,
        hasMore: paginationState.hasMore,
        isEnabled
      });
      return;
    }

    console.log('Loading more messages...');
    setPaginationState(prev => ({ ...prev, isLoading: true }));

    try {
      await dataManager.initDB();
      
      // 获取当前消息列表中最旧消息的时间戳
      const oldestMessageTimestamp = displayedMessages.length > 0 
        ? Math.min(...displayedMessages.map(msg => msg.timestamp))
        : Date.now();

      console.log('Loading messages before timestamp:', {
        oldestMessageTimestamp,
        displayedMessagesCount: displayedMessages.length,
        totalMessagesCount: chat.messages.length,
        pageSize: paginationState.pageSize
      });

      // 从数据库加载更早的消息
      const olderMessages = await dataManager.getChatMessagesBefore(
        chat.id,
        oldestMessageTimestamp,
        paginationState.pageSize
      );

      console.log('Database returned older messages:', {
        count: olderMessages.length,
        messages: olderMessages.map(msg => ({
          id: msg.id,
          timestamp: msg.timestamp,
          content: msg.content.substring(0, 50) + '...'
        }))
      });

      if (olderMessages.length > 0) {
        console.log('Loaded older messages:', olderMessages.length);

        // 更新消息列表（将新消息插入到开头）
        onLoadMoreMessages(olderMessages);

        // 使用多重requestAnimationFrame确保DOM完全更新后，由父组件统一修正滚动
        const applyParentScrollAdjustment = () => {
          const container = messagesContainerRef?.current || document.querySelector('.messages-container') as HTMLElement;
          if (container && scrollPositionRef.current) {
            const newScrollHeight = container.scrollHeight;
            onUpdateScrollPosition(scrollPositionRef.current.scrollHeight, newScrollHeight);
            scrollPositionRef.current = null;
          }
        };

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              applyParentScrollAdjustment();
            });
          });
        });

        // 更新分页状态
        setPaginationState(prev => ({
          ...prev,
          currentPage: prev.currentPage + 1,
          totalLoaded: prev.totalLoaded + olderMessages.length,
          hasMore: olderMessages.length === prev.pageSize
        }));
      } else {
        console.log('No more messages to load');
        // 没有更多消息了
        setPaginationState(prev => ({ ...prev, hasMore: false }));
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setPaginationState(prev => ({ ...prev, isLoading: false }));
    }
  }, [chat.id, chat.messages, paginationState, onLoadMoreMessages, isEnabled, displayedMessages, messagesContainerRef, onUpdateScrollPosition]);

  // 自动加载功能禁用，无需设置交叉观察器

  // 手动加载更多按钮
  const handleManualLoadMore = () => {
    // 立即记录滚动位置，避免任何延迟
    const container = messagesContainerRef?.current || document.querySelector('.messages-container') as HTMLElement;
    if (container) {
      scrollPositionRef.current = {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight
      };
      
      console.log('Immediately recorded scroll position on button click:', {
        scrollTop: scrollPositionRef.current.scrollTop,
        scrollHeight: scrollPositionRef.current.scrollHeight
      });
    }
    
    loadMoreMessages();
  };

  if (!isEnabled || !paginationState.hasMore) {
    return null;
  }

  const remainingMessages = chat.messages.length - displayedMessages.length;

  return (
    <div className="message-pagination-manager">
      {/* 手动加载按钮 */}
      <div className="load-more-button-container">
        <button
          className="load-more-button"
          onClick={handleManualLoadMore}
          disabled={paginationState.isLoading}
        >
          {paginationState.isLoading ? (
            <>
              <div className="loading-spinner"></div>
              <span>{t('QQ.ChatInterface.Pagination.loading', '加载中...')}</span>
            </>
          ) : (
            <>
              <span>{t('QQ.ChatInterface.Pagination.loadMore', '加载更多历史消息')}</span>
              <span className="message-count">
                {t('QQ.ChatInterface.Pagination.remaining', '(还有 {{count}} 条消息)').replace('{{count}}', String(remainingMessages))}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 