'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import './PostComposer.css';

interface PostComposerProps {
  onPublish: (postData: {
    content: string;
    images: string[];
    isPublic: boolean;
    location?: string;
    mood?: string;
    tags: string[];
  }) => void;
  onCancel: () => void;
  userInfo: {
    nickname: string;
    avatar: string;
  } | null;
}

export default function PostComposer({ onPublish, onCancel, userInfo }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newImages.push(result);
          setImages(prev => [...prev, ...newImages]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onPublish({
        content: content.trim(),
        images,
        isPublic,
        location: location.trim() || undefined,
        mood: mood.trim() || undefined,
        tags
      });
    } catch (error) {
      console.error('Failed to publish post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (content.trim() || images.length > 0) && !isSubmitting;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="api-settings-modal">
        <div className="modal-header">
          <h2>发布动态</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          {/* 用户信息 */}
          <div className="form-group">
            <div className="user-info-display">
              <Image 
                src={userInfo?.avatar || '/avatars/user-avatar.svg'} 
                alt={userInfo?.nickname || '用户'}
                width={40}
                height={40}
                className="user-avatar"
              />
              <div className="user-details">
                <div className="username">{userInfo?.nickname || '用户'}</div>
                <button 
                  className={`privacy-btn ${isPublic ? 'public' : 'private'}`}
                  onClick={() => setIsPublic(!isPublic)}
                >
                  {isPublic ? '🌍 公开' : '👥 仅好友'}
                </button>
              </div>
            </div>
          </div>

          {/* 文本输入 */}
          <div className="form-group">
            <label htmlFor="content">动态内容</label>
            <textarea
              ref={textareaRef}
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的想法..."
              rows={4}
              maxLength={500}
            />
            <small className="field-hint">最多500个字符</small>
          </div>

          {/* 图片预览 */}
          {images.length > 0 && (
            <div className="form-group">
              <label>图片预览</label>
              <div className="images-grid">
                {images.map((image, index) => (
                  <div key={index} className="image-container">
                    <Image 
                      src={image} 
                      alt={`图片 ${index + 1}`} 
                      width={80}
                      height={80}
                      className="preview-image" 
                    />
                    <button 
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                      aria-label="删除图片"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 添加图片按钮 */}
          <div className="form-group">
            <label>添加图片</label>
            <button 
              className="action-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 9}
            >
              添加图片
            </button>
            <small className="field-hint">最多上传9张图片</small>
          </div>

          {/* 标签输入 */}
          <div className="form-group">
            <label htmlFor="tag-input">标签</label>
            <div className="tag-input-container">
              <input
                type="text"
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="添加标签..."
                maxLength={20}
              />
              <button 
                className="add-tag-btn"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 5}
              >
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag, index) => (
                  <span key={index} className="tag-item">
                    #{tag}
                    <button 
                      className="remove-tag-btn"
                      onClick={() => removeTag(tag)}
                      aria-label={`删除标签 ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <small className="field-hint">最多添加5个标签</small>
          </div>

          {/* 位置和心情 */}
          <div className="form-group">
            <label htmlFor="location">位置</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="📍 添加位置"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mood">心情</label>
            <input
              type="text"
              id="mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="😊 添加心情"
              maxLength={20}
            />
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onCancel} disabled={isSubmitting}>取消</button>
          <button className="save-btn" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? '发布中...' : '发布动态'}
          </button>
        </div>
      </div>
    </div>
  );
} 