'use client';

import { useState, useEffect } from 'react';
import { WorldBook } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './WorldBookAssociationModal.css';

interface WorldBookAssociationModalProps {
  isVisible: boolean;
  chatName: string;
  currentLinkedIds: string[];
  onClose: () => void;
  onSave: (linkedIds: string[]) => void;
}

export default function WorldBookAssociationModal({ 
  isVisible, 
  chatName,
  currentLinkedIds, 
  onClose, 
  onSave 
}: WorldBookAssociationModalProps) {
  const [worldBooks, setWorldBooks] = useState<WorldBook[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 加载世界书列表
  const loadWorldBooks = async () => {
    try {
      setIsLoading(true);
      const books = await dataManager.getAllWorldBooks();
      books.sort((a, b) => a.name.localeCompare(b.name));
      setWorldBooks(books);
    } catch (error) {
      console.error('Failed to load world books:', error);
      alert('加载世界书失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    if (isVisible) {
      setSelectedIds([...currentLinkedIds]);
      loadWorldBooks();
    }
  }, [isVisible, currentLinkedIds]);

  // 切换选择状态
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // 保存关联
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(selectedIds);
      onClose();
    } catch (error) {
      console.error('Failed to save associations:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 取消
  const handleCancel = () => {
    setSelectedIds([...currentLinkedIds]);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="world-book-association-modal-overlay" onClick={handleCancel}>
      <div className="world-book-association-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-association-header">
          <h2 className="wb-association-title">关联世界书</h2>
          <button className="wb-close-btn" onClick={handleCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="m18 6-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m6 6 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="association-info">
          <p className="chat-info">为 <strong>{chatName}</strong> 选择要关联的世界书</p>
          <p className="help-text">选中的世界书内容将在AI聊天时自动注入到系统提示词中</p>
        </div>

        <div className="association-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : worldBooks.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>还没有世界书</h3>
              <p>请先创建世界书，然后再进行关联</p>
            </div>
          ) : (
            <div className="world-book-options">
              {worldBooks.map(worldBook => {
                const isSelected = selectedIds.includes(worldBook.id);
                const contentPreview = worldBook.content.length > 80 
                  ? worldBook.content.substring(0, 80) + '...'
                  : worldBook.content;

                return (
                  <div 
                    key={worldBook.id}
                    className={`world-book-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(worldBook.id)}
                  >
                    <div className="option-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(worldBook.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="world-book-info">
                      <div className="world-book-option-title">
                        {worldBook.name}
                        <span className="world-book-category-tag">{worldBook.category}</span>
                      </div>
                      {worldBook.description && (
                        <div className="world-book-option-description">{worldBook.description}</div>
                      )}
                      <div className="world-book-option-preview">{contentPreview}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="association-footer">
          <div className="selection-summary">
            已选择 {selectedIds.length} 个世界书
          </div>
          <div className="wb-footer-actions">
            <button className="wb-cancel-btn" onClick={handleCancel}>
              取消
            </button>
            <button 
              className={`wb-save-btn ${isSaving ? 'saving' : ''}`}
              onClick={handleSave}
              disabled={isSaving || worldBooks.length === 0}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}