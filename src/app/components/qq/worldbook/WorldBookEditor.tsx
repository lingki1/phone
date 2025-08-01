'use client';

import { useState, useEffect } from 'react';
import { WorldBook } from '../../../types/chat';
import './WorldBookEditor.css';

interface WorldBookEditorProps {
  worldBook?: WorldBook | null;
  onSave: (worldBook: WorldBook) => void;
  onCancel: () => void;
}

export default function WorldBookEditor({ worldBook, onSave, onCancel }: WorldBookEditorProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; content?: string }>({});

  // 初始化表单数据
  useEffect(() => {
    if (worldBook) {
      setName(worldBook.name);
      setContent(worldBook.content);
      setDescription(worldBook.description || '');
    } else {
      setName('');
      setContent('');
      setDescription('');
    }
    setErrors({});
  }, [worldBook]);

  // 表单验证
  const validateForm = () => {
    const newErrors: { name?: string; content?: string } = {};

    if (!name.trim()) {
      newErrors.name = '世界书名称不能为空';
    } else if (name.trim().length > 50) {
      newErrors.name = '世界书名称不能超过50个字符';
    }

    if (!content.trim()) {
      newErrors.content = '世界书内容不能为空';
    } else if (content.trim().length > 10000) {
      newErrors.content = '世界书内容不能超过10000个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存世界书
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const now = Date.now();
      const savedWorldBook: WorldBook = {
        id: worldBook?.id || `wb_${now}`,
        name: name.trim(),
        content: content.trim(),
        description: description.trim() || undefined,
        createdAt: worldBook?.createdAt || now,
        updatedAt: now
      };

      await onSave(savedWorldBook);
    } catch (error) {
      console.error('Failed to save world book:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    if (name || content || description) {
      if (window.confirm('确定要取消编辑吗？未保存的内容将丢失。')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const isEditing = !!worldBook;
  const title = isEditing ? '编辑世界书' : '创建世界书';

  return (
    <div className="world-book-editor">
      <div className="editor-header">
        <button className="back-btn" onClick={handleCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="editor-title">{title}</h1>
        <button 
          className={`save-btn ${isSaving ? 'saving' : ''}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>

      <div className="editor-content">
        <div className="form-group">
          <label htmlFor="worldbook-name" className="form-label">
            世界书名称 <span className="required">*</span>
          </label>
          <input
            id="worldbook-name"
            type="text"
            className={`world-book-name-input ${errors.name ? 'error' : ''}`}
            placeholder="请输入世界书名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
          <div className="char-count">{name.length}/50</div>
        </div>

        <div className="form-group">
          <label htmlFor="worldbook-description" className="form-label">
            简短描述
          </label>
          <input
            id="worldbook-description"
            type="text"
            className="world-book-description-input"
            placeholder="简短描述这个世界书的用途（可选）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
          />
          <div className="char-count">{description.length}/100</div>
        </div>

        <div className="form-group content-group">
          <label htmlFor="worldbook-content" className="form-label">
            世界书内容 <span className="required">*</span>
          </label>
          <textarea
            id="worldbook-content"
            className={`world-book-content-textarea ${errors.content ? 'error' : ''}`}
            placeholder="请输入世界书内容，这些内容将作为AI聊天的背景设定..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={10000}
          />
          {errors.content && <span className="error-message">{errors.content}</span>}
          <div className="char-count">{content.length}/10000</div>
        </div>
      </div>

      <div className="editor-footer">
        <button className="cancel-btn" onClick={handleCancel}>
          取消
        </button>
        <button 
          className={`save-btn-footer ${isSaving ? 'saving' : ''}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}