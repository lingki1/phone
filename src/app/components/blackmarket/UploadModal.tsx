'use client';

import { useState, useRef } from 'react';
import './UploadModal.css';
import { blackMarketService } from './blackMarketService';
import { useI18n } from '../../components/i18n/I18nProvider';


interface UploadStatus {
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  message: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

type UploadType = 'character' | 'worldbook';

export function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const { t } = useI18n();
  const [uploadType, setUploadType] = useState<UploadType>('character');
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [progress, setProgress] = useState<UploadStatus | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<{
    metadata?: Record<string, unknown>;
    thumbnail?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    
    // 根据文件类型自动设置上传类型
    if (selectedFile.type === 'image/png') {
      setUploadType('character');
      parseCharacterFile(selectedFile);
    } else if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
      setUploadType('worldbook');
      parseWorldBookFile(selectedFile);
    }

    // 如果没有设置名称，使用文件名（去掉扩展名）
    if (!name) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setName(fileName);
    }
  };

  // 解析角色卡文件
  const parseCharacterFile = async (file: File) => {
    try {
      // 创建缩略图
      if (file.type === 'image/png') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(prev => ({
            ...prev,
            thumbnail: e.target?.result as string
          }));
        };
        reader.readAsDataURL(file);
      }

      // 尝试解析元数据
      try {
        const metadata = await blackMarketService.parseCharacterMetadata(file);
        setPreview(prev => ({
          ...prev,
          metadata
        }));

        // 从元数据自动填充信息（进行类型收窄）
        const metaName = (metadata as Record<string, unknown>).name;
        if (typeof metaName === 'string' && !name) {
          setName(metaName);
        }
        const metaDesc = (metadata as Record<string, unknown>).description;
        if (typeof metaDesc === 'string' && !description) {
          setDescription(metaDesc);
        }
      } catch (error) {
        console.warn('无法解析角色卡元数据:', error);
      }
    } catch (error) {
      console.error('解析角色卡文件失败:', error);
    }
  };

  // 解析世界书文件
  const parseWorldBookFile = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          
          setPreview({
            metadata: {
              entryCount: Array.isArray(jsonData.entries) ? jsonData.entries.length : 0,
              ...jsonData
            }
          });

          // 从JSON自动填充信息
          if (jsonData.name && !name) {
            setName(jsonData.name);
          }
          if (jsonData.description && !description) {
            setDescription(jsonData.description);
          }
          if (jsonData.tags && Array.isArray(jsonData.tags)) {
            setTags(jsonData.tags);
          }
        } catch (error) {
          console.error('解析世界书JSON失败:', error);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('解析世界书文件失败:', error);
    }
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // 添加标签
  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags(prev => [...prev, newTag]);
      setTagInput('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // 处理上传
  const handleUpload = async () => {
    if (!file || !name.trim() || !description.trim()) {
      alert(t('BlackMarket.upload.fillAll', '请填写完整信息并选择文件'));
      return;
    }

    setProgress({
      progress: 0,
      status: 'uploading',
      message: t('BlackMarket.upload.starting', '开始上传...')
    });

    try {
      const metadata = {
        name: name.trim(),
        description: description.trim(),
        tags: tags
      };

      if (uploadType === 'character') {
        await blackMarketService.uploadCharacter(file, metadata);
      } else {
        await blackMarketService.uploadWorldBook(file, metadata);
      }

      setProgress({
        progress: 100,
        status: 'complete',
        message: t('BlackMarket.upload.success', '上传成功！')
      });

      setTimeout(() => {
        onUploadComplete();
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('上传失败:', error);
      setProgress({
        progress: 0,
        status: 'error',
        message: t('BlackMarket.upload.failed', '上传失败，请稍后重试')
      });
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    setFile(null);
    setName('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setProgress(null);
    setPreview(null);
    onClose();
  };

  // 验证文件类型
  const isValidFileType = (file: File) => {
    if (uploadType === 'character') {
      return file.type === 'image/png';
    } else {
      return file.type === 'application/json' || file.name.endsWith('.json');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="upload-modal">
      <div className="upload-container">
        <div className="upload-header">
          <h3>📤 {t('BlackMarket.upload.title', '上传到黑市')}</h3>
          <button className="upload-close" onClick={handleClose}>×</button>
        </div>

        <div className="upload-content">
          {/* 类型选择 */}
          <div className="upload-type-selector">
            <label>
              <input
                type="radio"
                value="character"
                checked={uploadType === 'character'}
                onChange={(e) => setUploadType(e.target.value as UploadType)}
              />
              {t('BlackMarket.upload.type.character', '👤 角色卡 (PNG格式)')}
            </label>
            <label>
              <input
                type="radio"
                value="worldbook"
                checked={uploadType === 'worldbook'}
                onChange={(e) => setUploadType(e.target.value as UploadType)}
              />
              {t('BlackMarket.upload.type.worldbook', '📚 世界书 (JSON格式)')}
            </label>
          </div>

          {/* 文件上传区域 */}
          <div
            className={`file-drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="file-info">
                <div className="file-icon">
                  {uploadType === 'character' ? '🖼️' : '📄'}
                </div>
                <div className="file-details">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  {!isValidFileType(file) && (
                    <p className="file-error">
                      ⚠️ 文件类型不正确，{uploadType === 'character' ? '请选择PNG图片' : '请选择JSON文件'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="drop-placeholder">
                <div className="drop-icon">
                  {uploadType === 'character' ? '🖼️' : '📄'}
                </div>
                <p>{t('BlackMarket.upload.dropHere', '拖拽文件到这里或点击选择')}</p>
                <p className="file-hint">
                  {t('BlackMarket.upload.supported', '支持格式：')}{uploadType === 'character' ? t('BlackMarket.upload.png', 'PNG图片（角色卡）') : t('BlackMarket.upload.json', 'JSON文件（世界书）')}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={uploadType === 'character' ? 'image/png' : 'application/json,.json'}
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  handleFileSelect(selectedFile);
                }
              }}
              style={{ display: 'none' }}
            />
          </div>

          {/* 预览区域 */}
          {preview && (
            <div className="file-preview">
              {preview.thumbnail && (
                // 这里使用原生 img 仅用于本地 data URL 预览，Next Image 不支持 data: 源的自动优化
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.thumbnail} alt={t('BlackMarket.upload.preview', '预览')} className="preview-image" />
              )}
              {preview.metadata && (
                <div className="metadata-preview">
                  <h4>{t('BlackMarket.upload.fileInfo', '文件信息')}</h4>
                  {uploadType === 'character' ? (
                    <div className="character-metadata">
                      {typeof (preview.metadata as Record<string, unknown>).personality === 'string' && (
                        <p><strong>{t('BlackMarket.upload.personality', '性格：')}</strong>{(preview.metadata as Record<string, unknown>).personality as string}</p>
                      )}
                      {typeof (preview.metadata as Record<string, unknown>).scenario === 'string' && (
                        <p><strong>{t('BlackMarket.upload.scenario', '场景：')}</strong>{(preview.metadata as Record<string, unknown>).scenario as string}</p>
                      )}
                    </div>
                  ) : (
                    <div className="worldbook-metadata">
                      <p><strong>{t('BlackMarket.upload.entryCount', '条目数量：')}</strong>{(preview.metadata as Record<string, unknown>).entryCount as number}</p>
                      {typeof (preview.metadata as Record<string, unknown>).theme === 'string' && (
                        <p><strong>{t('BlackMarket.upload.theme', '主题：')}</strong>{(preview.metadata as Record<string, unknown>).theme as string}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 基本信息 */}
          <div className="form-section">
            <label>
              {t('BlackMarket.upload.nameLabel', '名称 *')}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={uploadType === 'character' ? t('BlackMarket.upload.namePlaceholderCharacter', '输入角色名称') : t('BlackMarket.upload.namePlaceholderWorldBook', '输入世界书名称')}
                maxLength={50}
              />
            </label>

            <label>
              {t('BlackMarket.upload.descLabel', '描述 *')}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('BlackMarket.upload.descPlaceholder', '详细描述这个内容的特点和用途')}
                rows={4}
                maxLength={500}
              />
            </label>

            <label>
              {t('BlackMarket.upload.tagsLabel', '标签')}
              <div className="tags-input">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder={t('BlackMarket.upload.tagsPlaceholder', '添加标签，按回车确认')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button type="button" onClick={handleAddTag} disabled={!tagInput.trim()}>
                  {t('BlackMarket.upload.addTag', '添加')}
                </button>
              </div>
              <div className="tags-list">
                {tags.map((tag, index) => (
                  <span key={index} className="tag-item">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            </label>
          </div>

          {/* 进度显示 */}
          {progress && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <p className={`progress-message ${progress.status}`}>
                {progress.message}
              </p>
            </div>
          )}
        </div>

        <div className="upload-actions">
          <button className="cancel-button" onClick={handleClose} disabled={progress?.status === 'uploading'}>
            取消
          </button>
          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={!file || !name.trim() || !description.trim() || progress?.status === 'uploading' || (file && !isValidFileType(file))}
          >
            {progress?.status === 'uploading' ? '上传中...' : '上传'}
          </button>
        </div>
      </div>
    </div>
  );
}
