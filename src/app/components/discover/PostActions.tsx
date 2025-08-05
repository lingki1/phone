'use client';

import React from 'react';
import './PostActions.css';

interface PostActionsProps {
  isLiked: boolean;
  onLike: () => void;
}

export default function PostActions({ 
  isLiked, 
  onLike
}: PostActionsProps) {
  return (
    <div className="post-actions">
      <button 
        className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
        onClick={onLike}
        title={isLiked ? '取消点赞' : '点赞'}
        aria-label={isLiked ? '取消点赞' : '点赞'}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill={isLiked ? 'currentColor' : 'none'} 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span>点赞</span>
      </button>

      <button 
        className="action-btn share-btn"
        onClick={() => {
          // 分享功能（可以扩展）
          if (navigator.share) {
            navigator.share({
              title: '分享动态',
              text: '看看这条有趣的动态！',
              url: window.location.href
            });
          } else {
            // 复制链接
            navigator.clipboard.writeText(window.location.href).then(() => {
              // 可以显示提示
              console.log('链接已复制到剪贴板');
            });
          }
        }}
        title="分享"
        aria-label="分享"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
          <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <span>分享</span>
      </button>
    </div>
  );
} 