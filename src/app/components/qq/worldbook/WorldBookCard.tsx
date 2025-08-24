'use client';

import { WorldBook } from '../../../types/chat';
import './WorldBookCard.css';

interface WorldBookCardProps {
  worldBook: WorldBook;
  onEdit: (worldBook: WorldBook) => void;
  onDelete: (id: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export default function WorldBookCard({ 
  worldBook, 
  onEdit, 
  onDelete, 
  isSelectionMode = false, 
  isSelected = false, 
  onToggleSelection 
}: WorldBookCardProps) {
  const handleEdit = () => {
    onEdit(worldBook);
  };

  const handleDelete = () => {
    if (window.confirm(`确定要删除世界书"${worldBook.name}"吗？`)) {
      onDelete(worldBook.id);
    }
  };

  const handleToggleSelection = () => {
    if (onToggleSelection) {
      onToggleSelection();
    }
  };

  // 生成内容预览（最多显示100个字符）
  const contentPreview = worldBook.content.length > 100 
    ? worldBook.content.substring(0, 100) + '...'
    : worldBook.content;

  // 格式化创建时间
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`world-book-card ${isSelectionMode ? 'selection-mode' : ''} ${isSelected ? 'selected' : ''}`}>
      {isSelectionMode && (
        <div className="selection-checkbox" onClick={handleToggleSelection}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleToggleSelection}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      <div className="world-book-header">
        <h3 className="world-book-title">{worldBook.name}</h3>
        <div className="world-book-actions">
          {!isSelectionMode && (
            <>
              <button 
                className="action-btn edit-btn"
                onClick={handleEdit}
                title="编辑"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className="action-btn delete-btn"
                onClick={handleDelete}
                title="删除"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="m3 6 3 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="m10 11 0 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="m14 11 0 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      
      {worldBook.description && (
        <p className="world-book-description">{worldBook.description}</p>
      )}
      
      <div className="world-book-category">
        <span className="category-tag">{worldBook.category}</span>
      </div>
      
      <p className="world-book-preview">{contentPreview}</p>
      
      <div className="world-book-meta">
        <span className="world-book-date">创建于 {formatDate(worldBook.createdAt)}</span>
        <span className="world-book-length">{worldBook.content.length} 字符</span>
      </div>
    </div>
  );
}