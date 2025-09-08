'use client';

import React, { useState, useEffect } from 'react';
import { WorldBook } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './WorldBookAssociationSwitchModal.css';

interface WorldBookAssociationSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedWorldBookIds: string[];
  onUpdateLinkedWorldBooks: (worldBookIds: string[]) => void;
}

export default function WorldBookAssociationSwitchModal({
  isOpen,
  onClose,
  linkedWorldBookIds,
  onUpdateLinkedWorldBooks
}: WorldBookAssociationSwitchModalProps) {
  const [worldBooks, setWorldBooks] = useState<WorldBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // 加载世界书列表
  useEffect(() => {
    const loadWorldBooks = async () => {
      try {
        setIsLoading(true);
        const books = await dataManager.getAllWorldBooks();
        // 按更新时间倒序排列
        books.sort((a, b) => b.updatedAt - a.updatedAt);
        setWorldBooks(books);
        
        // 提取所有分类
        const allCategories = [...new Set(books.map(book => book.category))];
        setCategories(allCategories);
      } catch (error) {
        console.error('Failed to load world books:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadWorldBooks();
    }
  }, [isOpen]);

  // 切换世界书关联状态
  const toggleWorldBookAssociation = (worldBookId: string) => {
    const isCurrentlyLinked = linkedWorldBookIds.includes(worldBookId);
    
    if (isCurrentlyLinked) {
      // 取消关联
      const newLinkedIds = linkedWorldBookIds.filter(id => id !== worldBookId);
      onUpdateLinkedWorldBooks(newLinkedIds);
    } else {
      // 添加关联
      const newLinkedIds = [...linkedWorldBookIds, worldBookId];
      onUpdateLinkedWorldBooks(newLinkedIds);
    }
  };

  // 获取过滤后的世界书
  const getFilteredWorldBooks = () => {
    return worldBooks.filter(wb => {
      // 分类过滤
      if (selectedCategories.length > 0 && !selectedCategories.includes(wb.category)) {
        return false;
      }
      
      // 搜索过滤
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return wb.name.toLowerCase().includes(query) ||
               wb.content.toLowerCase().includes(query) ||
               wb.category.toLowerCase().includes(query) ||
               (wb.description && wb.description.toLowerCase().includes(query));
      }
      
      return true;
    });
  };

  const filteredWorldBooks = getFilteredWorldBooks();
  const linkedCount = linkedWorldBookIds.length;

  if (!isOpen) return null;

  // 切换分类选择
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  return (
    <div className="world-book-association-switch-modal-overlay" onClick={onClose}>
      <div className="world-book-association-switch-modal" onClick={e => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="wb-association-switch-modal-header">
          <h2>世界书关联管理</h2>
          <button className="wb-close-btn" onClick={onClose}>×</button>
        </div>

        {/* 搜索区域 */}
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="搜索世界书..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 分类标签区域 */}
        <div className="category-tags-section">
          <div className="category-tags">
            {categories.map(category => (
              <button
                key={category}
                className={`category-tag ${selectedCategories.includes(category) ? 'active' : ''}`}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 世界书列表 */}
        <div className="world-book-list-container">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : filteredWorldBooks.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>没有找到世界书</h3>
              <p>尝试调整搜索条件或分类筛选</p>
            </div>
          ) : (
            <div className="world-book-list">
              {filteredWorldBooks.map(worldBook => {
                const isLinked = linkedWorldBookIds.includes(worldBook.id);
                
                return (
                  <div key={worldBook.id} className="world-book-item">
                    <div className="world-book-name">{worldBook.name}</div>
                    <div className="world-book-toggle">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={isLinked}
                          onChange={() => toggleWorldBookAssociation(worldBook.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="wb-association-switch-modal-footer">
          <div className="wb-footer-info">
            <span>已关联: {linkedCount} 个</span>
          </div>
        </div>
      </div>
    </div>
  );
} 