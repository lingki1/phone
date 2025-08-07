'use client';

import React, { useState, useRef } from 'react';
import { WorldBook } from '../../../types/chat';
import './WorldBookImportModal.css';

interface WorldBookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (worldBooks: WorldBook[]) => void;
}

export default function WorldBookImportModal({ isOpen, onClose, onImport }: WorldBookImportModalProps) {
  const [importType, setImportType] = useState<'single' | 'batch'>('single');
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证JSON格式
  const validateJson = (jsonString: string): WorldBook[] | null => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // 如果是数组，验证每个元素
      if (Array.isArray(parsed)) {
        const validWorldBooks: WorldBook[] = [];
        
        for (const item of parsed) {
          if (validateWorldBookItem(item)) {
            validWorldBooks.push(item);
          } else {
            throw new Error(`无效的世界书数据: ${item.name || '未知'}`);
          }
        }
        
        if (validWorldBooks.length === 0) {
          throw new Error('没有找到有效的世界书数据');
        }
        
        return validWorldBooks;
      }
      
      // 如果是单个对象，验证并包装成数组
      if (validateWorldBookItem(parsed)) {
        return [parsed];
      }
      
      throw new Error('无效的世界书数据格式');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`JSON解析错误: ${error.message}`);
      }
      throw new Error('JSON格式错误');
    }
  };

  // 验证单个世界书数据
  const validateWorldBookItem = (item: unknown): item is WorldBook => {
    if (!item || typeof item !== 'object') return false;
    
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.name === 'string' &&
      typeof obj.content === 'string' &&
      typeof obj.category === 'string' &&
      obj.name.trim() !== '' &&
      obj.content.trim() !== '' &&
      obj.category.trim() !== ''
    );
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      setValidationError('');
    };
    reader.onerror = () => {
      setValidationError('文件读取失败');
    };
    reader.readAsText(file);
  };

  // 处理导入
  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setValidationError('请输入JSON数据');
      return;
    }

    try {
      setValidationError('');
      const worldBooks = validateJson(jsonInput);
      
      if (worldBooks) {
        setIsImporting(true);
        await onImport(worldBooks);
        setJsonInput('');
        setValidationError('');
      }
    } catch (error) {
      if (error instanceof Error) {
        setValidationError(error.message);
      } else {
        setValidationError('导入失败，请检查数据格式');
      }
    } finally {
      setIsImporting(false);
    }
  };

  // 生成示例JSON
  const generateExample = () => {
    const example = importType === 'single' 
      ? {
          name: "示例世界书",
          content: "这是一个示例世界设定...",
          category: "示例分类",
          description: "这是一个示例描述"
        }
      : [
          {
            name: "世界书1",
            content: "第一个世界设定...",
            category: "分类1",
            description: "第一个描述"
          },
          {
            name: "世界书2", 
            content: "第二个世界设定...",
            category: "分类2",
            description: "第二个描述"
          }
        ];
    
    setJsonInput(JSON.stringify(example, null, 2));
    setValidationError('');
  };

  // 清空输入
  const clearInput = () => {
    setJsonInput('');
    setValidationError('');
  };

  if (!isOpen) return null;

  return (
    <div className="world-book-import-modal-overlay" onClick={onClose}>
      <div className="world-book-import-modal" onClick={e => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="import-modal-header">
          <h2>导入世界书</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 导入类型选择 */}
        <div className="import-type-selector">
          <button 
            className={`type-btn ${importType === 'single' ? 'active' : ''}`}
            onClick={() => setImportType('single')}
          >
            📄 单个导入
          </button>
          <button 
            className={`type-btn ${importType === 'batch' ? 'active' : ''}`}
            onClick={() => setImportType('batch')}
          >
            📚 批量导入
          </button>
        </div>

        {/* 说明文字 */}
        <div className="import-description">
          <p>
            {importType === 'single' 
              ? '导入单个世界书，JSON格式应包含 name、content、category 字段'
              : '批量导入多个世界书，JSON格式应为数组，每个元素包含 name、content、category 字段'
            }
          </p>
        </div>

        {/* 文件上传 */}
        <div className="file-upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button 
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 选择JSON文件
          </button>
        </div>

        {/* JSON输入区域 */}
        <div className="json-input-section">
          <div className="input-header">
            <label htmlFor="json-input">JSON数据</label>
            <div className="input-actions">
              <button className="action-btn" onClick={generateExample}>
                📝 生成示例
              </button>
              <button className="action-btn" onClick={clearInput}>
                🗑️ 清空
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            className="json-input"
            placeholder={`请输入${importType === 'single' ? '单个世界书' : '世界书数组'}的JSON数据...`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={12}
          />
        </div>

        {/* 错误提示 */}
        {validationError && (
          <div className="error-message">
            ⚠️ {validationError}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="import-modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            取消
          </button>
          <button 
            className={`import-btn ${isImporting ? 'importing' : ''}`}
            onClick={handleImport}
            disabled={isImporting || !jsonInput.trim()}
          >
            {isImporting ? '导入中...' : '开始导入'}
          </button>
        </div>
      </div>
    </div>
  );
} 