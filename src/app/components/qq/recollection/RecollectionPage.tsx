'use client';

import React, { useState, useEffect } from 'react';
import BottomNavigation from '../BottomNavigation';
import RecollectionList from './RecollectionList';
import RecollectionDetail from './RecollectionDetail';
import { WorldBook } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './RecollectionPage.css';

export default function RecollectionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecollection, setSelectedRecollection] = useState<WorldBook | null>(null);
  const [recollections, setRecollections] = useState<WorldBook[]>([]);

  // 新内容计数状态
  const [newContentCount, setNewContentCount] = useState<{
    moments?: number;
    messages?: number;
  }>({});

  // 加载回忆数据
  const loadRecollections = async () => {
    try {
      const allWorldBooks = await dataManager.getAllWorldBooks();
      const recollectionItems = allWorldBooks.filter(item => 
        item.category === 'recollection'
      );
      const sortedRecollections = recollectionItems.sort((a, b) => 
        (b.createdAt || 0) - (a.createdAt || 0)
      );
      setRecollections(sortedRecollections);
    } catch (error) {
      console.error('Failed to load recollections:', error);
    }
  };

  // 加载新内容计数
  useEffect(() => {
    const loadNewContentCount = async () => {
      try {
        // 这里可以添加获取回忆相关新内容的逻辑
        setNewContentCount({
          moments: 0,
          messages: 0
        });
      } catch (error) {
        console.warn('Failed to load new content count:', error);
      }
    };

    const initializeData = async () => {
      await loadRecollections();
      await loadNewContentCount();
      setIsLoading(false);
    };

    initializeData();
  }, []);

  // 监听新内容更新事件
  useEffect(() => {
    const handleNewContentUpdate = async () => {
      try {
        // 这里可以添加更新回忆相关新内容的逻辑
        setNewContentCount(prev => ({
          ...prev,
          moments: 0,
          messages: 0
        }));
      } catch (error) {
        console.warn('Failed to update new content count:', error);
      }
    };

    window.addEventListener('aiPostGenerated', handleNewContentUpdate);
    window.addEventListener('aiCommentsGenerated', handleNewContentUpdate);
    window.addEventListener('viewStateUpdated', handleNewContentUpdate);
    
    return () => {
      window.removeEventListener('aiPostGenerated', handleNewContentUpdate);
      window.removeEventListener('aiCommentsGenerated', handleNewContentUpdate);
      window.removeEventListener('viewStateUpdated', handleNewContentUpdate);
    };
  }, []);

  // 处理底部导航切换
  const handleViewChange = (view: string) => {
    console.log('RecollectionPage - 底部导航点击:', view);
    
    if (view === 'messages') {
      // 跳转到消息页面
      console.log('RecollectionPage - 触发navigateToChat事件');
      window.dispatchEvent(new CustomEvent('navigateToChat'));
    } else if (view === 'moments') {
      // 跳转到动态页面
      console.log('RecollectionPage - 触发navigateToDiscover事件');
      window.dispatchEvent(new CustomEvent('navigateToDiscover'));
    } else if (view === 'me') {
      // 跳转到个人页面
      console.log('RecollectionPage - 触发navigateToMe事件');
      window.dispatchEvent(new CustomEvent('navigateToMe'));
    }
    // 'recollection' 已经在当前页面，不需要处理
    
    // 切换页面时更新新内容计数
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('viewStateUpdated'));
    }, 100);
  };

  // 处理选择回忆条目
  const handleSelectRecollection = (recollection: WorldBook) => {
    setSelectedRecollection(recollection);
  };

  // 处理返回列表
  const handleBackToList = () => {
    setSelectedRecollection(null);
  };

  if (isLoading) {
    return (
      <div className="recollection-page recollection-loading">
        <div className="recollection-loading-spinner">
          <div className="recollection-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recollection-page">
      <div className="recollection-content">
        {selectedRecollection ? (
          // 显示回忆详情
          <RecollectionDetail
            recollection={selectedRecollection}
            onBack={handleBackToList}
          />
        ) : (
          // 显示回忆列表
          <>
            <div className="recollection-header">
              <h1>回忆</h1>
              <span className="recollection-count">共 {recollections.length} 条</span>
            </div>
            
            <div className="recollection-body">
              <RecollectionList onSelectRecollection={handleSelectRecollection} />
            </div>
          </>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNavigation
        activeView="recollection"
        onViewChange={handleViewChange}
        newContentCount={newContentCount}
        forceShow={true}
      />
    </div>
  );
}
