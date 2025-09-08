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
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  // 分页
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;
  // 分类更换弹窗
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [modalExistingCategory, setModalExistingCategory] = useState<string>('');
  const [modalNewCategory, setModalNewCategory] = useState<string>('');
  
  // 批量删除相关状态
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // 加载世界书列表
  const loadWorldBooks = async () => {
    try {
      setIsLoading(true);
      const books = await dataManager.getAllWorldBooks();
      // 按更新时间倒序排列
      books.sort((a, b) => b.updatedAt - a.updatedAt);
      setWorldBooks(books);
      // 提取分类选项
      const cats = Array.from(new Set(books.map(b => b.category).filter(Boolean))).sort();
      setCategoryOptions(cats);
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

  // 切换选择模式
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  // 选择/取消选择世界书
  const toggleSelection = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredWorldBooks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWorldBooks.map(wb => wb.id)));
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      alert('请先选择要删除的世界书');
      return;
    }

    const confirmMessage = `确定要删除选中的 ${selectedIds.size} 个世界书吗？此操作不可撤销。`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsDeleting(true);
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        try {
          await dataManager.deleteWorldBook(id);
          successCount++;
        } catch (error) {
          console.error('Failed to delete world book:', id, error);
          errorCount++;
        }
      }

      // 重新加载世界书列表
      await loadWorldBooks();
      
      // 退出选择模式
      setIsSelectionMode(false);
      setSelectedIds(new Set());

      // 显示删除结果
      if (errorCount === 0) {
        alert(`成功删除 ${successCount} 个世界书`);
      } else {
        alert(`删除完成：成功 ${successCount} 个，失败 ${errorCount} 个`);
      }
    } catch (error) {
      console.error('Batch delete failed:', error);
      alert('批量删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  // 批量更换分类
  const handleBatchChangeCategory = async (newCategory: string) => {
    if (!newCategory) return;
    if (selectedIds.size === 0) {
      alert('请先选择要更换分类的世界书');
      return;
    }
    try {
      setIsDeleting(true);
      let successCount = 0;
      let errorCount = 0;

      const updated = await Promise.all(worldBooks.map(async wb => {
        if (!selectedIds.has(wb.id)) return wb;
        const next: WorldBook = { ...wb, category: newCategory, updatedAt: Date.now() };
        try {
          await dataManager.updateWorldBook(next);
          successCount++;
          return next;
        } catch (e) {
          console.error('Failed to update category:', wb.id, e);
          errorCount++;
          return wb;
        }
      }));

      setWorldBooks(updated);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      const cats = Array.from(new Set(updated.map(b => b.category).filter(Boolean))).sort();
      setCategoryOptions(cats);
      alert(errorCount === 0 ? `成功更新 ${successCount} 个世界书的分类` : `更新完成：成功 ${successCount} 个，失败 ${errorCount} 个`);
    } finally {
      setIsDeleting(false);
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

  const finallyFilteredWorldBooks = filteredWorldBooks.filter(wb => !categoryFilter || wb.category === categoryFilter);
  const totalPages = Math.max(1, Math.ceil(finallyFilteredWorldBooks.length / pageSize));
  const currentPageSafe = Math.min(Math.max(1, currentPage), totalPages);
  const pageStartIndex = (currentPageSafe - 1) * pageSize;
  const pageItems = finallyFilteredWorldBooks.slice(pageStartIndex, pageStartIndex + pageSize);

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
        <div className="wb-header-actions">
          {!isSelectionMode ? (
            <>
              <button className="selection-mode-btn" onClick={toggleSelectionMode}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                批量操作
              </button>
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
            </>
          ) : null}
        </div>
      </div>

      {/* 批量工具条（单独一行） */}
      {isSelectionMode && (
        <div className="groupmember-batch-toolbar">
          {/* 第一行：已选择 x 个 */}
          <div className="groupmember-batch-row groupmember-batch-row-1">
            <span className="groupmember-selected-count">已选择 {selectedIds.size} 个</span>
          </div>
          {/* 第二行：全选 删除 */}
          <div className="groupmember-batch-row groupmember-batch-row-2">
            <button 
              className="select-all-btn"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === filteredWorldBooks.length ? '取消全选' : '全选'}
            </button>
            <button 
              className="batch-delete-btn"
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0 || isDeleting}
            >
              {isDeleting ? '删除中...' : `删除 (${selectedIds.size})`}
            </button>
          </div>
          {/* 第三行：更换分类 取消 */}
          <div className="groupmember-batch-row groupmember-batch-row-3">
            <button
              className="groupmember-apply-new-category-btn"
              onClick={() => {
                setModalExistingCategory('');
                setModalNewCategory('');
                setShowCategoryModal(true);
              }}
            >更换分类</button>
            <button 
              className="cancel-selection-btn"
              onClick={toggleSelectionMode}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="world-book-content">
        {/* 搜索框 */}
        <div className="search-container">
          <div className="search-box">
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
          {/* 分类筛选标签 */}
          {categoryOptions.length > 0 && (
            <div className="groupmember-category-filter-tags">
              <button
                type="button"
                className={`groupmember-tag-btn ${!categoryFilter ? 'active' : ''}`}
                onClick={() => setCategoryFilter('')}
              >全部</button>
              {categoryOptions.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`groupmember-tag-btn ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >{cat}</button>
              ))}
            </div>
          )}
        </div>

        {/* 世界书列表 */}
        <div className="world-book-list">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : finallyFilteredWorldBooks.length === 0 ? (
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
                  {searchQuery || categoryFilter ? `找到 ${finallyFilteredWorldBooks.length} 个结果` : `共 ${worldBooks.length} 个世界书`}
                </span>
                {isSelectionMode && (
                  <span className="selection-count">
                    已选择 {selectedIds.size} 个
                  </span>
                )}
              </div>
              {pageItems.map(worldBook => (
                <WorldBookCard
                  key={worldBook.id}
                  worldBook={worldBook}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(worldBook.id)}
                  onToggleSelection={() => toggleSelection(worldBook.id)}
                />
              ))}
              {/* 分页器 */}
              <div className="groupmember-wb-pagination">
                <button
                  className="groupmember-wb-page-btn"
                  disabled={currentPageSafe <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >上一页</button>
                <span className="groupmember-wb-page-info">{currentPageSafe} / {totalPages}</span>
                <button
                  className="groupmember-wb-page-btn"
                  disabled={currentPageSafe >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >下一页</button>
              </div>
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

      {/* 批量更换分类弹窗 */}
      {showCategoryModal && (
        <div className="groupmember-category-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="groupmember-category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="groupmember-category-modal-header">
              <h3>批量更换分类</h3>
              <button className="groupmember-category-modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            <div className="groupmember-category-modal-body">
              <div className="groupmember-category-row">
                <label>选择已有分类</label>
                <select
                  className="groupmember-batch-category-select"
                  value={modalExistingCategory}
                  onChange={(e) => setModalExistingCategory(e.target.value)}
                >
                  <option value="">不选择</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="groupmember-category-row">
                <label>或输入新分类</label>
                <input
                  type="text"
                  className="groupmember-batch-category-input"
                  value={modalNewCategory}
                  onChange={(e) => setModalNewCategory(e.target.value)}
                  placeholder="例如：extrainfo / notes / tags…"
                />
              </div>
              <div className="groupmember-category-tip">提示：优先使用新分类；若未填写新分类则使用下拉选择的分类。</div>
            </div>
            <div className="groupmember-category-modal-footer">
              <button className="groupmember-category-cancel" onClick={() => setShowCategoryModal(false)}>取消</button>
              <button
                className="groupmember-category-apply"
                onClick={() => {
                  const value = (modalNewCategory.trim() || modalExistingCategory).trim();
                  if (!value) return;
                  handleBatchChangeCategory(value);
                  setShowCategoryModal(false);
                }}
                disabled={selectedIds.size === 0 || (!modalNewCategory.trim() && !modalExistingCategory)}
              >应用</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}