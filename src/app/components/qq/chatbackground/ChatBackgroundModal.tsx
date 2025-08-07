'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import './ChatBackgroundModal.css';
import './ChatBackgroundAnimations.css';
import AnimationSelector from './AnimationSelector';

interface ChatBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackground?: string;
  currentAnimation?: string;
  currentOpacity?: number;
  onSave: (background: string, animation: string, opacity?: number) => void;
  chatName: string;
}

export default function ChatBackgroundModal({
  isOpen,
  onClose,
  currentBackground,
  currentAnimation = 'none',
  currentOpacity = 80,
  onSave,
  chatName
}: ChatBackgroundModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(currentBackground || null);
  const [selectedAnimation, setSelectedAnimation] = useState<string>(currentAnimation);
  const [selectedOpacity, setSelectedOpacity] = useState<number>(80); // 默认80%透明度
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 打开弹窗或外部值变化时，同步内部预览与设置，避免保存为空导致清空背景
  useEffect(() => {
    if (isOpen) {
      setSelectedImage(currentBackground || null);
      setSelectedAnimation(currentAnimation || 'none');
      setSelectedOpacity(typeof currentOpacity === 'number' ? currentOpacity : 80);
    }
  }, [isOpen, currentBackground, currentAnimation, currentOpacity]);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB');
      return;
    }

    setError(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError('图片读取失败');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // 处理保存
  const handleSave = async () => {
    console.log('保存按钮被点击', { selectedImage, currentBackground, selectedAnimation, selectedOpacity });
    try {
      // 如果有选中的图片，使用选中的图片；否则使用当前背景
      const backgroundToSave = selectedImage || currentBackground || '';
      await onSave(backgroundToSave, selectedAnimation, selectedOpacity);
      console.log('背景保存成功');
    } catch (error) {
      console.error('保存背景失败:', error);
      setError('保存失败，请重试');
    }
  };

  // 处理清除背景
  const handleClear = async () => {
    setSelectedImage(null);
    setSelectedAnimation('none');
    setSelectedOpacity(80);
    await onSave('', 'none', 80);
  };

  // 处理点击上传按钮
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* 头部 */}
        <div className="modal-header">
          <h3>设置聊天背景 - {chatName}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 内容区域 */}
        <div className="modal-body">
          {/* 上传区域 */}
          <div className="upload-section">
            <div className="upload-area" onClick={handleUploadClick}>
              {isLoading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <span>处理中...</span>
                </div>
              ) : selectedImage ? (
                <div className={`preview ${selectedAnimation !== 'none' ? `background-animation-${selectedAnimation === '3d' ? '3d' : selectedAnimation}` : ''}`}>
                  <Image
                    src={selectedImage}
                    alt="背景预览"
                    width={400}
                    height={300}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                  <div className="preview-overlay">
                    <span>点击更换图片</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <span>点击上传背景图片</span>
                  <small>支持 JPG、PNG、GIF 格式，最大 5MB</small>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* 透明度控制 */}
          {selectedImage && (
            <div className="opacity-control">
              <label htmlFor="opacity-slider">背景透明度: {selectedOpacity}%</label>
              <input
                id="opacity-slider"
                type="range"
                min="10"
                max="100"
                value={selectedOpacity}
                onChange={(e) => setSelectedOpacity(Number(e.target.value))}
                className="opacity-slider"
              />
            </div>
          )}

          {/* 动画选择器 */}
          <AnimationSelector
            selectedAnimation={selectedAnimation}
            onAnimationChange={setSelectedAnimation}
            isVisible={!!selectedImage}
          />
        </div>

        {/* 底部按钮 */}
        <div className="modal-footer">
          <button 
            className="clear-btn"
            onClick={handleClear}
            disabled={!currentBackground && !selectedImage}
          >
            清除背景
          </button>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onClose}>
              取消
            </button>
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={!selectedImage && !currentBackground}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 