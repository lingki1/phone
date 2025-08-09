'use client';

import React, { useState, useEffect } from 'react';
import { dataManager } from '../../utils/dataManager';
import { avatarManager } from '../../utils/avatarManager';
import { DiscoverPost, DiscoverSettings, DiscoverComment } from '../../types/discover';
import { ChatItem } from '../../types/chat';
import { aiCommentService } from './utils/aiCommentService';
import { autoGenerationService } from './utils/autoGenerationService';
import BottomNavigation from '../qq/BottomNavigation';

import PostComposer from './PostComposer';
import PostList from './PostList';
import DiscoverHeader from './DiscoverHeader';
import DiscoverSettingsPanel from './DiscoverSettingsPanel';
import './DiscoverPage.css';

export default function DiscoverPage() {
  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [settings, setSettings] = useState<DiscoverSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    nickname: string;
    avatar: string;
  } | null>(null);

  // 新内容计数状态
  const [newContentCount, setNewContentCount] = useState<{
    moments?: number;
    messages?: number;
  }>({});

  // 加载新内容计数
  useEffect(() => {
    const loadNewContentCount = async () => {
      try {
        const { newPostsCount, newCommentsCount } = await dataManager.calculateNewContentCount('user');
        setNewContentCount({
          moments: newPostsCount + newCommentsCount
        });
      } catch (error) {
        console.warn('Failed to load new content count:', error);
      }
    };

    loadNewContentCount();
    
    // 页面加载时立即触发一次计数更新，确保底部导航显示正确的状态
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('viewStateUpdated'));
    }, 100);
  }, []);

  // 监听新内容更新事件
  useEffect(() => {
    const handleNewContentUpdate = async () => {
      try {
        const { newPostsCount, newCommentsCount } = await dataManager.calculateNewContentCount('user');
        setNewContentCount(prev => ({
          ...prev,
          moments: newPostsCount + newCommentsCount
        }));
      } catch (error) {
        console.warn('Failed to update new content count:', error);
      }
    };

    window.addEventListener('aiPostGenerated', handleNewContentUpdate);
    window.addEventListener('aiCommentsGenerated', handleNewContentUpdate);
    window.addEventListener('viewStateUpdated', handleNewContentUpdate);
    
    return () => {
      window.removeEventListener('aiPostGenerated', handleNewContentUpdate);
      window.removeEventListener('aiCommentsGenerated', handleNewContentUpdate);
      window.removeEventListener('viewStateUpdated', handleNewContentUpdate);
    };
  }, []);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // 设置超时机制，确保不会永远卡在加载状态
        const loadingTimeout = setTimeout(() => {
          console.warn('⚠️ 数据加载超时，强制完成加载');
          setIsLoading(false);
        }, 10000); // 10秒超时
        
        // 初始化头像管理器
        await avatarManager.init();
        
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

        // 启动自动生成服务（异步执行，不阻塞页面加载）
        if (settingsData) {
          // 异步启动，不等待完成
          autoGenerationService.start(settingsData).then(() => {
            console.log('🚀 自动生成服务已启动');
          }).catch((error) => {
            console.warn('⚠️ 自动生成服务启动失败:', error);
          });
        }

        // 数据加载完成后，检查是否需要更新新内容计数
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('viewStateUpdated'));
        }, 200);

        // 清除超时定时器
        clearTimeout(loadingTimeout);

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
        
        // 触发新内容计数更新
        window.dispatchEvent(new CustomEvent('viewStateUpdated'));
        
        console.log(`动态 ${postId} 的AI评论已更新，共 ${updatedComments.length} 条评论`);
      } catch (error) {
        console.error('Failed to update AI comments:', error);
      }
    };

          // 监听AI动态生成完成事件
      const handleAiPostGenerated = async () => {
        try {
          // 重新加载所有动态
          const postsData = await dataManager.getAllDiscoverPosts();
          const postsWithComments = await Promise.all(
            postsData.map(async (p) => {
              const postComments = await dataManager.getDiscoverCommentsByPost(p.id);
              return {
                ...p,
                comments: postComments
              };
            })
          );
          
          setPosts(postsWithComments);
          
          // 触发新内容计数更新
          window.dispatchEvent(new CustomEvent('viewStateUpdated'));
          
          console.log('✅ AI动态生成完成，已更新动态列表');
        } catch (error) {
          console.error('Failed to update AI posts:', error);
        }
      };

    window.addEventListener('aiCommentsGenerated', handleAiCommentsGenerated);
    window.addEventListener('aiPostGenerated', handleAiPostGenerated);
    
    return () => {
      window.removeEventListener('aiCommentsGenerated', handleAiCommentsGenerated);
      window.removeEventListener('aiPostGenerated', handleAiPostGenerated);
    };
  }, []);

  // 用户进入动态页面时更新查看状态
  useEffect(() => {
    const updateViewState = async () => {
      if (posts.length > 0) {
        const latestPost = posts[0]; // 最新的动态
        try {
          await dataManager.updateDiscoverViewState('user', latestPost.timestamp, latestPost.id);
          
          // 触发查看状态更新事件
          window.dispatchEvent(new CustomEvent('viewStateUpdated'));
          
          console.log('✅ 已更新用户查看状态，时间戳:', latestPost.timestamp);
        } catch (error) {
          console.warn('Failed to update view state:', error);
        }
      }
    };

    // 延迟执行，确保页面完全加载
    const timer = setTimeout(updateViewState, 1000);
    return () => clearTimeout(timer);
  }, [posts]);

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
      // 注册用户头像到全局头像管理器
      const userAvatarId = avatarManager.generateAvatarId('user', 'main');
      await avatarManager.registerAvatar(userAvatarId, userInfo.avatar);

      const newPost: DiscoverPost = {
        id: Date.now().toString(),
        authorId: 'user',
        authorName: userInfo.nickname,
        authorAvatarId: userAvatarId,
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

      // 触发动态更新事件
      window.dispatchEvent(new CustomEvent('aiPostGenerated'));
      
      // 触发新内容计数更新
      window.dispatchEvent(new CustomEvent('viewStateUpdated'));

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
      
      // 触发新内容计数更新
      window.dispatchEvent(new CustomEvent('viewStateUpdated'));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };



  // 处理删除动态
  const handleDeletePost = async (postId: string) => {
    try {
      // 确认删除
      if (!confirm('确定要删除这条动态吗？删除后无法恢复。')) {
        return;
      }

      // 删除动态
      await dataManager.deleteDiscoverPost(postId);
      
      // 删除相关的评论
      const post = posts.find(p => p.id === postId);
      if (post && post.comments.length > 0) {
        for (const comment of post.comments) {
          try {
            await dataManager.deleteDiscoverComment(comment.id);
          } catch (error) {
            console.warn('删除评论失败:', comment.id, error);
          }
        }
      }
      
      // 更新本地状态
      setPosts(prev => prev.filter(p => p.id !== postId));
      
      // 触发新内容计数更新
      window.dispatchEvent(new CustomEvent('viewStateUpdated'));
      
      console.log('✅ 动态删除成功:', postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('删除动态失败，请重试');
    }
  };

  // 处理评论
  const handleComment = async (postId: string, content: string, replyTo?: string) => {
    if (!userInfo) return;

    try {
      // 注册用户头像到全局头像管理器
      const userAvatarId = avatarManager.generateAvatarId('user', 'main');
      await avatarManager.registerAvatar(userAvatarId, userInfo.avatar);

      const comment: DiscoverComment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        postId,
        authorId: 'user',
        authorName: userInfo.nickname,
        authorAvatarId: userAvatarId,
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

      // 触发新内容计数更新
      window.dispatchEvent(new CustomEvent('viewStateUpdated'));

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

  // 处理底部导航切换
  const handleViewChange = (view: string) => {
    console.log('DiscoverPage - 底部导航点击:', view);
    
    if (view === 'messages') {
      // 跳转到消息页面
      console.log('DiscoverPage - 触发navigateToChat事件');
      window.dispatchEvent(new CustomEvent('navigateToChat'));
    } else if (view === 'me') {
      // 跳转到个人页面
      console.log('DiscoverPage - 触发navigateToMe事件');
      window.dispatchEvent(new CustomEvent('navigateToMe'));
    }
    // 'moments' 已经在当前页面，不需要处理
    
    // 切换页面时更新新内容计数
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('viewStateUpdated'));
    }, 100);
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
          postCount={posts.length}
        />
        
        <PostList 
          posts={posts}
          onLike={handleLike}
          onComment={handleComment}
          onDelete={handleDeletePost}
          currentUserId="user"
        />
      </div>

      {/* 底部导航 */}
      <BottomNavigation
        activeView="moments"
        onViewChange={handleViewChange}
        newContentCount={newContentCount}
        forceShow={true}
      />

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


    </div>
  );
} 