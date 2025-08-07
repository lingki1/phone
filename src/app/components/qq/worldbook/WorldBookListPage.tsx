'use client';

import { useState, useEffect } from 'react';
import { WorldBook } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import WorldBookCard from './WorldBookCard';
import WorldBookEditor from './WorldBookEditor';
import WorldBookImportModal from './WorldBookImportModal';
import './WorldBookListPage.css';

interface WorldBookListPageProps {
  onBack: () => void;
}

export default function WorldBookListPage({ onBack }: WorldBookListPageProps) {
  const [worldBooks, setWorldBooks] = useState<WorldBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorldBook, setEditingWorldBook] = useState<WorldBook | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // 加载世界书列表
  const loadWorldBooks = async () => {
    try {
      setIsLoading(true);
      const books = await dataManager.getAllWorldBooks();
      // 按更新时间倒序排列
      books.sort((a, b) => b.updatedAt - a.updatedAt);
      setWorldBooks(books);
    } catch (error) {
      console.error('Failed to load world books:', error);
      alert('加载世界书失败，请刷新重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadWorldBooks();
  }, []);

  // 创建新世界书
  const handleCreateNew = () => {
    setEditingWorldBook(null);
    setShowEditor(true);
  };

  // 编辑世界书
  const handleEdit = (worldBook: WorldBook) => {
    setEditingWorldBook(worldBook);
    setShowEditor(true);
  };

  // 删除世界书
  const handleDelete = async (id: string) => {
    try {
      await dataManager.deleteWorldBook(id);
      setWorldBooks(prev => prev.filter(wb => wb.id !== id));
    } catch (error) {
      console.error('Failed to delete world book:', error);
      alert('删除失败，请重试');
    }
  };

  // 保存世界书
  const handleSave = async (worldBook: WorldBook) => {
    try {
      if (editingWorldBook) {
        // 更新现有世界书
        await dataManager.updateWorldBook(worldBook);
        setWorldBooks(prev => prev.map(wb => 
          wb.id === worldBook.id ? worldBook : wb
        ));
      } else {
        // 创建新世界书
        await dataManager.saveWorldBook(worldBook);
        setWorldBooks(prev => [worldBook, ...prev]);
      }
      setShowEditor(false);
      setEditingWorldBook(null);
    } catch (error) {
      console.error('Failed to save world book:', error);
      throw error; // 让编辑器处理错误
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setShowEditor(false);
    setEditingWorldBook(null);
  };

  // 导入世界书
  const handleImport = async (worldBooksData: WorldBook[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const worldBookData of worldBooksData) {
        try {
          // 生成新的ID和时间戳
          const newWorldBook: WorldBook = {
            ...worldBookData,
            id: `wb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          await dataManager.saveWorldBook(newWorldBook);
          successCount++;
        } catch (error) {
          console.error('Failed to import world book:', worldBookData.name, error);
          errorCount++;
        }
      }
      
      // 重新加载世界书列表
      await loadWorldBooks();
      
      // 显示导入结果
      if (errorCount === 0) {
        alert(`成功导入 ${successCount} 个世界书`);
      } else {
        alert(`导入完成：成功 ${successCount} 个，失败 ${errorCount} 个`);
      }
      
      setShowImportModal(false);
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败，请重试');
    }
  };

  // 过滤世界书
  const filteredWorldBooks = worldBooks.filter(wb => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return wb.name.toLowerCase().includes(query) ||
           wb.content.toLowerCase().includes(query) ||
           wb.category.toLowerCase().includes(query) ||
           (wb.description && wb.description.toLowerCase().includes(query));
  });

  // 如果正在显示编辑器
  if (showEditor) {
    return (
      <WorldBookEditor
        worldBook={editingWorldBook}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="world-book-list-page">
      <div className="world-book-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="page-title">世界书管理</h1>
        <div className="header-actions">
          <button className="import-btn" onClick={() => setShowImportModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            导入
          </button>
          <button className="create-btn" onClick={handleCreateNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            创建
          </button>
        </div>
      </div>

      <div className="world-book-content">
        {/* 搜索框 */}
        <div className="search-container">
          <div className="search-box">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="搜索世界书名称、内容或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m15 9-6 6"/>
                  <path d="m9 9 6 6"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 世界书列表 */}
        <div className="world-book-list">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : filteredWorldBooks.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? (
                <>
                  <svg className="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3>未找到相关世界书</h3>
                  <p>尝试使用其他关键词搜索</p>
                </>
              ) : (
                <>
                  <svg className="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <h3>还没有世界书</h3>
                  <p>创建你的第一个世界书，为AI聊天添加丰富的背景设定</p>
                  <button className="create-first-btn" onClick={handleCreateNew}>
                    创建第一个世界书
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="list-header">
                <span className="result-count">
                  {searchQuery ? `找到 ${filteredWorldBooks.length} 个结果` : `共 ${worldBooks.length} 个世界书`}
                </span>
              </div>
              {filteredWorldBooks.map(worldBook => (
                <WorldBookCard
                  key={worldBook.id}
                  worldBook={worldBook}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* 导入模态框 */}
      {showImportModal && (
        <WorldBookImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}