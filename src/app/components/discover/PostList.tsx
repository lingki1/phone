'use client';

import React from 'react';
import { DiscoverPost } from '../../types/discover';
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
  if (posts.length === 0) {
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

  return (
    <div className="discover-content">
      <div className="post-list">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => onLike(post.id)}
            onComment={onComment}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
} 