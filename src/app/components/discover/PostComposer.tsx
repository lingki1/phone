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
    <div className="post-composer-overlay">
      <div className="post-composer">
        <div className="composer-header">
          <button 
            className="composer-cancel-btn"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </button>
          <h2 className="composer-title">发布动态</h2>
          <button 
            className={`composer-publish-btn ${canSubmit ? 'active' : ''}`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? '发布中...' : '发布'}
          </button>
        </div>

        <div className="composer-content">
          {/* 用户信息 */}
          <div className="composer-user-info">
            <Image 
              src={userInfo?.avatar || '/avatars/user-avatar.svg'} 
              alt={userInfo?.nickname || '用户'}
              width={48}
              height={48}
              className="composer-avatar"
            />
            <div className="composer-user-details">
              <div className="composer-username">{userInfo?.nickname || '用户'}</div>
              <div className="composer-privacy">
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
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的想法..."
            className="composer-textarea"
            rows={4}
            maxLength={500}
          />

          {/* 图片预览 */}
          {images.length > 0 && (
            <div className="composer-images">
              {images.map((image, index) => (
                <div key={index} className="composer-image-container">
                  <Image 
                    src={image} 
                    alt={`图片 ${index + 1}`} 
                    width={120}
                    height={120}
                    className="composer-image" 
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
          )}

          {/* 标签输入 */}
          <div className="composer-tags">
            <div className="tags-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="添加标签..."
                className="tag-input"
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
          </div>

          {/* 位置和心情 */}
          <div className="composer-options">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="📍 添加位置"
              className="composer-input location-input"
              maxLength={50}
            />
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="😊 添加心情"
              className="composer-input mood-input"
              maxLength={20}
            />
          </div>

          {/* 操作按钮 */}
          <div className="composer-actions">
            <button 
              className="action-btn image-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 9}
            >
              📷 图片
            </button>
            <button className="action-btn location-btn">
              📍 位置
            </button>
            <button className="action-btn mood-btn">
              😊 心情
            </button>
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
      </div>
    </div>
  );
} 