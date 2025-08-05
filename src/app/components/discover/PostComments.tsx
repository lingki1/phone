'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { DiscoverComment } from '../../types/discover';
import './PostComments.css';

interface PostCommentsProps {
  comments: DiscoverComment[];
  onComment?: (postId: string, content: string) => void;
  postId?: string;
  currentUserId?: string;
}

export default function PostComments({ 
  comments, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onComment: _onComment, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postId: _postId, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserId: _currentUserId 
}: PostCommentsProps) {
  const [showAllComments, setShowAllComments] = useState(false);
  
  // 按时间戳排序，最新的在前面
  const sortedComments = [...comments].sort((a, b) => b.timestamp - a.timestamp);
  
  // 默认显示最新的8条评论
  const defaultDisplayCount = 8;
  const displayedComments = showAllComments 
    ? sortedComments 
    : sortedComments.slice(0, defaultDisplayCount);
  
  const hasMoreComments = sortedComments.length > defaultDisplayCount;
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

  if (comments.length === 0) {
    return (
      <div className="post-comments">
        <div className="comments-empty">
          <span>还没有评论，快来抢沙发吧！</span>
        </div>
      </div>
    );
  }

  return (
    <div className="post-comments">
      <div className="comments-list">
        {displayedComments.map((comment) => (
          <div key={comment.id} className={`comment-item ${comment.aiGenerated ? 'ai-generated' : ''}`}>
            <div className="comment-avatar">
              <Image 
                src={comment.authorAvatar} 
                alt={comment.authorName}
                width={32}
                height={32}
                className="comment-avatar-img"
              />
            </div>
            
            <div className="comment-content">
              <div className="comment-header">
                <span className="comment-author">{comment.authorName}</span>
                <span className="comment-time">{formatTime(comment.timestamp)}</span>
              </div>
              
              <div className="comment-text">{renderContentWithMentions(comment.content)}</div>
              
              {comment.likes.length > 0 && (
                <div className="comment-likes">
                  ❤️ {comment.likes.length} 人点赞
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {hasMoreComments && (
        <div className="comments-more">
          <button 
            className="show-more-btn"
            onClick={() => setShowAllComments(!showAllComments)}
          >
            {showAllComments 
              ? `收起评论 (${sortedComments.length}条)` 
              : `查看更多评论 (${sortedComments.length - defaultDisplayCount}条)`
            }
          </button>
        </div>
      )}
      
      {comments.length > 0 && (
        <div className="comments-summary">
          <span className="comments-count">
            共 {comments.length} 条评论
          </span>
        </div>
      )}
    </div>
  );
} 