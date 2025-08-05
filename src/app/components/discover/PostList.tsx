'use client';

import React, { useState, useEffect } from 'react';
import { DiscoverPost } from '../../types/discover';
import { dataManager } from '../../utils/dataManager';
import PostCard from './PostCard';
import './PostList.css';

interface PostListProps {
  posts: DiscoverPost[];
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  currentUserId: string;
}

export default function PostList({ 
  posts, 
  onLike, 
  onComment, 
  currentUserId 
}: PostListProps) {
  const [postsWithNewMarkers, setPostsWithNewMarkers] = useState<DiscoverPost[]>([]);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(0);

  // 更新用户查看状态
  const updateViewState = async (timestamp: number) => {
    try {
      await dataManager.updateDiscoverViewState(currentUserId, timestamp);
      setLastViewedTimestamp(timestamp);
      console.log('✅ 已更新查看状态，时间戳:', timestamp);
    } catch (error) {
      console.warn('Failed to update view state:', error);
    }
  };

  // 标记新内容
  useEffect(() => {
    const markNewContent = async () => {
      try {
        // 获取用户最后查看时间
        const viewState = await dataManager.getDiscoverViewState(currentUserId);
        const currentLastViewed = viewState?.lastViewedTimestamp || 0;
        setLastViewedTimestamp(currentLastViewed);
        
        const markedPosts = posts.map(post => ({
          ...post,
          isNew: post.timestamp > currentLastViewed && post.authorId !== currentUserId,
          comments: post.comments.map(comment => ({
            ...comment,
            isNew: comment.timestamp > currentLastViewed && comment.authorId !== currentUserId
          }))
        }));
        
        setPostsWithNewMarkers(markedPosts);
      } catch (error) {
        console.warn('Failed to get view state, using fallback logic:', error);
        // 降级逻辑：使用1小时前作为默认值
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        setLastViewedTimestamp(oneHourAgo);
        
        const markedPosts = posts.map(post => ({
          ...post,
          isNew: post.timestamp > oneHourAgo && post.authorId !== currentUserId,
          comments: post.comments.map(comment => ({
            ...comment,
            isNew: comment.timestamp > oneHourAgo && comment.authorId !== currentUserId
          }))
        }));
        
        setPostsWithNewMarkers(markedPosts);
      }
    };

    markNewContent();
  }, [posts, currentUserId, lastViewedTimestamp]);
  // 如果还没有处理完，显示加载状态
  if (postsWithNewMarkers.length === 0 && posts.length > 0) {
    return (
      <div className="discover-content">
        <div className="discover-loading">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (postsWithNewMarkers.length === 0) {
    return (
      <div className="discover-content">
        <div className="discover-empty">
          <div className="discover-empty-icon">📱</div>
          <div className="discover-empty-title">还没有动态</div>
          <div className="discover-empty-description">
            发布你的第一条动态，开始分享生活吧！
          </div>
        </div>
      </div>
    );
  }

  // 处理动态可见性变化
  const handlePostVisibility = (post: DiscoverPost) => {
    // 如果这个动态比当前查看时间新，更新查看状态
    if (post.timestamp > lastViewedTimestamp) {
      updateViewState(post.timestamp);
    }
  };

  return (
    <div className="discover-content">
      <div className="post-list">
        {postsWithNewMarkers.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => onLike(post.id)}
            onComment={onComment}
            currentUserId={currentUserId}
            onVisibilityChange={() => handlePostVisibility(post)}
          />
        ))}
      </div>
    </div>
  );
} 