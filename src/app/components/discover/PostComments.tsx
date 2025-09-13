'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DiscoverComment } from '../../types/discover';
import AvatarImage from './AvatarImage';
import { useI18n } from '../i18n/I18nProvider';
import './PostComments.css';

interface PostCommentsProps {
  comments: DiscoverComment[];
  onComment: (postId: string, content: string, replyTo?: string) => void;
  postId: string;
  currentUserId: string;
  onCommentsVisibilityChange?: () => void; // 新增：评论可见性变化回调
}

export default function PostComments({ 
  comments, 
  onComment, 
  postId, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserId,
  onCommentsVisibilityChange
}: PostCommentsProps) {
  const { t, locale } = useI18n();
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState<{ commentId: string; authorName: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const commentsRef = useRef<HTMLDivElement>(null);

  // 监听评论区域可见性
  useEffect(() => {
    if (!onCommentsVisibilityChange || comments.length === 0) return;

    // 调试日志已移除

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onCommentsVisibilityChange();
            observer.disconnect(); // 只触发一次
          }
        });
      },
      { threshold: 0.3 } // 当30%可见时触发
    );

    if (commentsRef.current) {
      observer.observe(commentsRef.current);
    }

    return () => observer.disconnect();
  }, [onCommentsVisibilityChange, comments.length, postId, comments]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('QQ.ChatInterface.Discover.PostComments.time.justNow', '刚刚');
    if (minutes < 60) return t('QQ.ChatInterface.Discover.PostComments.time.minutesAgo', '{{minutes}}分钟前').replace('{{minutes}}', minutes.toString());
    if (hours < 24) return t('QQ.ChatInterface.Discover.PostComments.time.hoursAgo', '{{hours}}小时前').replace('{{hours}}', hours.toString());
    if (days < 7) return t('QQ.ChatInterface.Discover.PostComments.time.daysAgo', '{{days}}天前').replace('{{days}}', days.toString());
    
    return new Date(timestamp).toLocaleDateString(locale || 'zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTo({ commentId, authorName });
    setReplyContent(`@${authorName} `);
  };

  const handleSubmitReply = () => {
    if (replyContent.trim() && replyTo) {
      onComment(postId, replyContent.trim(), replyTo.commentId);
      setReplyContent('');
      setReplyTo(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitReply();
    }
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyContent('');
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

  // 按时间戳排序评论（越早的越在上方）
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => a.timestamp - b.timestamp);
  }, [comments]);

  // 显示评论数量 - 默认显示最新的3条评论
  const displayedComments = showAllComments ? sortedComments : sortedComments.slice(-3);
  const hasMoreComments = sortedComments.length > 3;

  if (comments.length === 0) {
    return (
      <div className="post-comments">
        <div className="comments-empty">
          {t('QQ.ChatInterface.Discover.PostComments.empty', '还没有评论，快来抢沙发吧！')}
        </div>
      </div>
    );
  }

  return (
    <div className="post-comments" ref={commentsRef}>
      <div className="comments-list">
        {displayedComments.map((comment) => (
          <div key={comment.id} className={`comment-item ${comment.aiGenerated ? 'ai-generated' : ''} ${comment.isNew ? 'new-comment' : ''}`}>
            {/* 新评论标记 */}
            {comment.isNew && (
              <div className="new-comment-indicator">
                <span className="new-badge">{t('QQ.ChatInterface.Discover.PostComments.newBadge', '新')}</span>
              </div>
            )}
            <div className="comment-avatar">
              <AvatarImage 
                avatarId={comment.authorAvatarId}
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
              
              <div className="comment-actions">
                {comment.likes.length > 0 && (
                  <span className="comment-likes">
                    ❤️ {comment.likes.length}
                  </span>
                )}
                <button 
                  className="reply-btn"
                  onClick={() => handleReply(comment.id, comment.authorName)}
                >
                  {t('QQ.ChatInterface.Discover.PostComments.reply', '回复')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 回复输入框 */}
      {replyTo && (
        <div className="reply-input-container">
          <div className="reply-input-header">
            <span className="reply-to-text">{t('QQ.ChatInterface.Discover.PostComments.replyTo', '回复 @{{name}}').replace('{{name}}', replyTo.authorName)}</span>
            <button className="cancel-reply-btn" onClick={handleCancelReply}>
              ×
            </button>
          </div>
          <div className="reply-input-content">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('QQ.ChatInterface.Discover.PostComments.replyInput.placeholder', '写下你的回复...')}
              className="reply-textarea"
              rows={2}
            />
            <button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim()}
              className="reply-submit-btn"
            >
              {t('QQ.ChatInterface.Discover.PostComments.replyInput.send', '发送')}
            </button>
          </div>
        </div>
      )}

      {/* 显示更多/收起评论按钮 */}
      {hasMoreComments && (
        <button 
          className="show-more-comments-btn"
          onClick={() => setShowAllComments(!showAllComments)}
        >
          {showAllComments 
            ? t('QQ.ChatInterface.Discover.PostComments.showMore.collapse', '收起评论（只显示最新 {{count}} 条）').replace('{{count}}', Math.min(3, sortedComments.length).toString())
            : t('QQ.ChatInterface.Discover.PostComments.showMore.expand', '查看全部 {{total}} 条评论（包含 {{old}} 条老评论）').replace('{{total}}', comments.length.toString()).replace('{{old}}', (sortedComments.length - 3).toString())
          }
        </button>
      )}
    </div>
  );
} 