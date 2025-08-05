'use client';

import React, { useState, useEffect } from 'react';
import { dataManager } from '../../utils/dataManager';
import { DiscoverPost, DiscoverSettings, DiscoverComment } from '../../types/discover';
import { ChatItem } from '../../types/chat';
import { aiPostGenerator } from './utils/aiPostGenerator';
import { aiCommentService } from './utils/aiCommentService';

import { ApiDebugger } from './utils/apiDebugger';
import PostComposer from './PostComposer';
import PostList from './PostList';
import DiscoverHeader from './DiscoverHeader';
import DiscoverSettingsPanel from './DiscoverSettingsPanel';
import BottomNavigation from '../qq/BottomNavigation';
import './DiscoverPage.css';

export default function DiscoverPage() {
  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [settings, setSettings] = useState<DiscoverSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeView, setActiveView] = useState('moments');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    nickname: string;
    avatar: string;
  } | null>(null);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // 并行加载数据
        const [postsData, settingsData, personalSettings] = await Promise.all([
          dataManager.getAllDiscoverPosts(),
          dataManager.getDiscoverSettings(),
          dataManager.getPersonalSettings()
        ]);

        // 为每个动态加载评论数据
        const postsWithComments = await Promise.all(
          postsData.map(async (post) => {
            const comments = await dataManager.getDiscoverCommentsByPost(post.id);
            return {
              ...post,
              comments: comments
            };
          })
        );

        setPosts(postsWithComments);
        setSettings(settingsData);
        setUserInfo({
          nickname: personalSettings.userNickname,
          avatar: personalSettings.userAvatar
        });
      } catch (error) {
        console.error('Failed to load discover data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 监听AI评论生成完成事件
  useEffect(() => {
    const handleAiCommentsGenerated = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { postId } = customEvent.detail;
      
      try {
        // 重新加载该动态的评论
        const updatedComments = await dataManager.getDiscoverCommentsByPost(postId);
        
        // 更新本地状态
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comments: updatedComments }
            : post
        ));
        
        console.log(`动态 ${postId} 的AI评论已更新，共 ${updatedComments.length} 条评论`);
      } catch (error) {
        console.error('Failed to update AI comments:', error);
      }
    };

    window.addEventListener('aiCommentsGenerated', handleAiCommentsGenerated);
    
    return () => {
      window.removeEventListener('aiCommentsGenerated', handleAiCommentsGenerated);
    };
  }, []);

  // 发布新动态
  const handlePublishPost = async (postData: {
    content: string;
    images: string[];
    isPublic: boolean;
    location?: string;
    mood?: string;
    tags: string[];
  }) => {
    if (!userInfo) return;

    try {
      const newPost: DiscoverPost = {
        id: Date.now().toString(),
        authorId: 'user',
        authorName: userInfo.nickname,
        authorAvatar: userInfo.avatar,
        content: postData.content,
        images: postData.images,
        timestamp: Date.now(),
        likes: [],
        comments: [],
        isPublic: postData.isPublic,
        location: postData.location,
        mood: postData.mood,
        tags: postData.tags,
        type: postData.images.length > 0 ? (postData.content ? 'mixed' : 'image') : 'text',
        aiGenerated: false
      };

      await dataManager.saveDiscoverPost(newPost);
      setPosts(prev => [newPost, ...prev]);
      setShowComposer(false);

      // 触发AI角色互动
      triggerAiInteraction(newPost);
    } catch (error) {
      console.error('Failed to publish post:', error);
    }
  };

  // 触发AI角色互动
  const triggerAiInteraction = async (post: DiscoverPost) => {
    try {
      // 使用新的AI评论服务
      if (settings?.allowAiComments) {
        console.log('🚀 开始生成AI评论，跳过API配置验证');
        
        // 获取AI角色
        const chats = await dataManager.getAllChats();
        const aiCharacters = chats.filter(chat => !chat.isGroup);
        
        if (aiCharacters.length > 0) {
          // 后台异步处理AI评论生成
          setTimeout(async () => {
            try {
              console.log(`💬 为用户动态生成AI评论`);
              await aiCommentService.generateCommentsForPost(post);
              
              // 触发评论更新事件
              window.dispatchEvent(new CustomEvent('aiCommentsGenerated', {
                detail: { postId: post.id }
              }));
            } catch (error) {
              console.error('后台AI评论生成失败:', error);
            }
          }, 2000); // 延迟2秒开始生成
        }
      }

      // 保留原有的点赞逻辑
      if (settings?.allowAiLikes) {
        const chats = await dataManager.getAllChats();
        const aiCharacters = chats.filter(chat => !chat.isGroup);
        
        for (const character of aiCharacters) {
          if (Math.random() < 0.5) {
            await generateAiLike(post, character);
          }
        }
      }
    } catch (error) {
      console.error('Failed to trigger AI interaction:', error);
    }
  };



  // 生成AI点赞
  const generateAiLike = async (post: DiscoverPost, character: ChatItem) => {
    try {
      const updatedPost = {
        ...post,
        likes: [...post.likes, character.id]
      };

      await dataManager.saveDiscoverPost(updatedPost);
      
      // 更新本地状态
      setPosts(prev => prev.map(p => 
        p.id === post.id ? updatedPost : p
      ));
    } catch (error) {
      console.error('Failed to generate AI like:', error);
    }
  };



  // 刷新动态
  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }
    
    try {
      setIsRefreshing(true);
      setIsLoading(true);
      
      // 获取所有AI角色
      const chats = await dataManager.getAllChats();
      const aiCharacters = chats.filter(chat => !chat.isGroup);
      
      if (aiCharacters.length === 0) {
        return;
      }

      // 生成单个最有争议的动态和评论
      if (settings?.autoGeneratePosts) {
        const result = await aiPostGenerator.generateSinglePostWithComments(aiCharacters);
        if (result.post) {
          // 更新本地状态，添加新生成的动态
          const postWithComments = {
            ...result.post,
            comments: result.comments
          };
          setPosts(prev => [postWithComments, ...prev]);
        }
      }
      
      // 重新加载所有动态
      const postsData = await dataManager.getAllDiscoverPosts();
      const postsWithComments = await Promise.all(
        postsData.map(async (post) => {
          const comments = await dataManager.getDiscoverCommentsByPost(post.id);
          return {
            ...post,
            comments: comments
          };
        })
      );
      
      setPosts(postsWithComments);
    } catch (error) {
      console.error('Failed to refresh posts:', error);
      alert('❌ 刷新动态失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 处理点赞
  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const isLiked = post.likes.includes('user');
      const updatedLikes = isLiked 
        ? post.likes.filter(id => id !== 'user')
        : [...post.likes, 'user'];

      const updatedPost = { ...post, likes: updatedLikes };
      await dataManager.saveDiscoverPost(updatedPost);
      
      setPosts(prev => prev.map(p => 
        p.id === postId ? updatedPost : p
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  // 处理视图变化
  const handleViewChange = (view: string) => {
    console.log('DiscoverPage - handleViewChange 被调用:', view);
    
    if (view === 'messages') {
      // 跳转到聊天页面
      console.log('跳转到聊天页面');
      // 通过自定义事件告诉主页面跳转到聊天列表页面
      window.dispatchEvent(new CustomEvent('navigateToChat'));
    } else if (view === 'moments') {
      // 已经在动态页面，不需要操作
      console.log('保持在动态页面');
      setActiveView('moments');
    } else if (view === 'me') {
      // 跳转到个人页面
      console.log('跳转到个人页面');
      // 通过自定义事件告诉主页面跳转到个人页面
      window.dispatchEvent(new CustomEvent('navigateToMe'));
    }
  };

  // 处理评论
  const handleComment = async (postId: string, content: string, replyTo?: string) => {
    if (!userInfo) return;

    try {
      const comment: DiscoverComment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        postId,
        authorId: 'user',
        authorName: userInfo.nickname,
        authorAvatar: userInfo.avatar,
        content,
        timestamp: Date.now(),
        likes: [],
        aiGenerated: false,
        replyTo: replyTo // 添加回复目标
      };

      await dataManager.saveDiscoverComment(comment);
      
      // 更新本地状态，立即显示用户评论
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments: [...p.comments, comment] }
          : p
      ));

      // 触发AI评论生成
      await triggerAiCommentForPost(postId);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  // 触发AI评论生成
  const triggerAiCommentForPost = async (postId: string) => {
    try {
      // 检查设置是否允许AI评论
      if (!settings?.allowAiComments) {
        console.log('AI评论功能已禁用');
        return;
      }

      // 获取当前动态
      const currentPost = posts.find(p => p.id === postId);
      if (!currentPost) {
        console.error('未找到动态:', postId);
        return;
      }

      console.log('💬 用户评论后触发AI评论生成，动态ID:', postId);

      // 使用AI评论服务生成评论
      const result = await aiCommentService.generateCommentsForPost(currentPost);
      
      if (result.success) {
        console.log('✅ AI评论生成成功，共生成', result.comments.length, '条评论');
        
        // 触发评论更新事件，让UI自动刷新
        window.dispatchEvent(new CustomEvent('aiCommentsGenerated', {
          detail: { postId: postId }
        }));
      } else {
        console.warn('⚠️ AI评论生成失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 触发AI评论生成失败:', error);
    }
  };

  // 测试API配置
  const handleTestApi = async () => {
    try {
      console.log('🔧 开始API配置测试...');
      const result = await ApiDebugger.testApiConfig();
      
      if (result.success) {
        alert('✅ API配置测试成功！\n\n' + result.message);
      } else {
        const errorMessage = ApiDebugger.formatErrorMessage(result);
        alert('❌ API配置测试失败！\n\n' + errorMessage);
      }
    } catch (error) {
      console.error('API测试失败:', error);
      alert('❌ API测试过程中发生错误: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  if (isLoading) {
    return (
      <div className="discover-page discover-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="discover-page">
      <div className="discover-content">
        <DiscoverHeader 
          onCompose={() => setShowComposer(true)}
          onSettings={() => setShowSettings(true)}
          onRefresh={handleRefresh}
          onTestApi={handleTestApi}
          postCount={posts.length}
        />
        
        <PostList 
          posts={posts}
          onLike={handleLike}
          onComment={handleComment}
          currentUserId="user"
        />
      </div>

      {showComposer && (
        <PostComposer
          onPublish={handlePublishPost}
          onCancel={() => setShowComposer(false)}
          userInfo={userInfo}
        />
      )}

      {showSettings && settings && (
        <DiscoverSettingsPanel
          settings={settings}
          onSave={async (newSettings) => {
            await dataManager.saveDiscoverSettings(newSettings);
            setSettings(newSettings);
            setShowSettings(false);
          }}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {/* 底部导航 */}
      <BottomNavigation
        activeView={activeView}
        onViewChange={handleViewChange}
      />
    </div>
  );
} 