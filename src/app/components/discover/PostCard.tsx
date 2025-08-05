'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { DiscoverPost } from '../../types/discover';
import PostImages from './PostImages';
import PostActions from './PostActions';
import PostComments from './PostComments';
import './PostCard.css';

interface PostCardProps {
  post: DiscoverPost;
  onLike: () => void;
  onComment: (postId: string, content: string) => void;
  currentUserId: string;
  onVisibilityChange?: () => void;
}

export default function PostCard({ 
  post, 
  onLike, 
  onComment, 
  currentUserId,
  onVisibilityChange
}: PostCardProps) {

  const [commentInput, setCommentInput] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  // 监听动态可见性
  useEffect(() => {
    if (!onVisibilityChange) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisibilityChange();
            observer.disconnect(); // 只触发一次
          }
        });
      },
      { threshold: 0.5 } // 当50%可见时触发
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [onVisibilityChange]);

  const isLiked = post.likes.includes(currentUserId);
  const isAiGenerated = post.aiGenerated;

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSubmitComment = () => {
    if (commentInput.trim()) {
      onComment(post.id, commentInput.trim());
      setCommentInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  // 处理@提及的显示
  const renderContentWithMentions = (content: string) => {
    const mentionRegex = /@([^\s]+)/g;
    const parts = content.split(mentionRegex);
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // 普通文本
        result.push(parts[i]);
      } else {
        // @提及
        result.push(
          <span key={i} className="mention">
            @{parts[i]}
          </span>
        );
      }
    }
    
    return result;
  };

  return (
    <div 
      ref={cardRef}
      className={`post-card ${isAiGenerated ? 'ai-generated' : ''} ${post.isNew ? 'new-post' : ''}`}
    >
      {/* 新动态标记 */}
      {post.isNew && (
        <div className="new-post-indicator">
          <span className="new-badge">新</span>
        </div>
      )}
      
      {/* 作者信息 */}
      <div className="post-header">
        <div className="post-author">
          <Image 
            src={post.authorAvatar} 
            alt={post.authorName}
            width={40}
            height={40}
            className="post-avatar"
          />
          <div className="post-author-info">
            <div className="post-author-name">
              {post.authorName}
            </div>
            <div className="post-meta">
              <span className="post-time">{formatTime(post.timestamp)}</span>
              {post.location && (
                <>
                  <span className="post-separator">·</span>
                  <span className="post-location">{post.location}</span>
                </>
              )}
              {post.mood && (
                <>
                  <span className="post-separator">·</span>
                  <span className="post-mood">{post.mood}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="post-privacy">
          {post.isPublic ? '🌍' : '👥'}
        </div>
      </div>

      {/* 动态内容 */}
      <div className="post-content">
        {post.content && (
          <div className="post-text">{renderContentWithMentions(post.content)}</div>
        )}
        
        {post.images && post.images.length > 0 && (
          <PostImages images={post.images} />
        )}
        
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="post-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* 互动统计 */}
      <div className="post-stats">
        {post.likes.length > 0 && (
          <div className="post-likes-count">
            ❤️ {post.likes.length} 人点赞
          </div>
        )}
        {post.comments.length > 0 && (
          <div className="post-comments-count">
            💬 {post.comments.length} 条评论
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <PostActions
        isLiked={isLiked}
        onLike={onLike}
      />

      {/* 评论区域 */}
      <PostComments
        comments={post.comments}
        onComment={onComment}
        postId={post.id}
        currentUserId={currentUserId}
      />

      {/* 评论输入框 */}
      <div className="post-comment-input">
        <textarea
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="写下你的评论..."
          className="comment-textarea"
          rows={1}
        />
        <button
          onClick={handleSubmitComment}
          disabled={!commentInput.trim()}
          className="comment-submit-btn"
        >
          发送
        </button>
      </div>
    </div>
  );
} 