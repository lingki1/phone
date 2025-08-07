'use client';

import React, { useState, useEffect } from 'react';
import { dataManager } from '../../../utils/dataManager';
import './ChatBackgroundManager.css';
import './ChatBackgroundAnimations.css';

interface ChatBackgroundManagerProps {
  chatId: string;
  onBackgroundChange: (background: string, animation?: string, opacity?: number) => void;
  children: React.ReactNode;
}

export default function ChatBackgroundManager({
  chatId,
  onBackgroundChange,
  children
}: ChatBackgroundManagerProps) {
  const [currentBackground, setCurrentBackground] = useState<string>('');
  const [currentAnimation, setCurrentAnimation] = useState<string>('none');
  const [currentOpacity, setCurrentOpacity] = useState<number>(80);

  // 加载背景图片和动画
  useEffect(() => {
    const loadBackground = async () => {
      try {
        await dataManager.initDB();
        const background = await dataManager.getChatBackground(chatId);
        const animation = localStorage.getItem(`chatAnimation_${chatId}`) || 'none';
        const opacity = Number(localStorage.getItem(`chatOpacity_${chatId}`)) || 80;
        setCurrentBackground(background || '');
        setCurrentAnimation(animation);
        setCurrentOpacity(opacity);
        onBackgroundChange(background || '', animation, opacity);
      } catch (error) {
        console.error('Failed to load chat background:', error);
        // 如果数据库加载失败，尝试从localStorage加载
        const fallbackBackground = localStorage.getItem(`chatBackground_${chatId}`);
        const fallbackAnimation = localStorage.getItem(`chatAnimation_${chatId}`) || 'none';
        const fallbackOpacity = Number(localStorage.getItem(`chatOpacity_${chatId}`)) || 80;
        if (fallbackBackground) {
          setCurrentBackground(fallbackBackground);
          setCurrentAnimation(fallbackAnimation);
          setCurrentOpacity(fallbackOpacity);
          onBackgroundChange(fallbackBackground, fallbackAnimation, fallbackOpacity);
        }
      }
    };

    loadBackground();
  }, [chatId, onBackgroundChange]);

  // 监听背景更新事件
  useEffect(() => {
    const handleBackgroundUpdate = (event: CustomEvent) => {
      if (event.detail.chatId === chatId) {
        console.log('背景更新事件:', event.detail);
        setCurrentBackground(event.detail.background || '');
        setCurrentAnimation(event.detail.animation || 'none');
        setCurrentOpacity(event.detail.opacity || 80);
        onBackgroundChange(event.detail.background || '', event.detail.animation || 'none', event.detail.opacity || 80);
      }
    };

    window.addEventListener('backgroundUpdated', handleBackgroundUpdate as EventListener);
    
    return () => {
      window.removeEventListener('backgroundUpdated', handleBackgroundUpdate as EventListener);
    };
  }, [chatId, onBackgroundChange]);

  return (
    <div 
      className="chat-background-container"
      style={{
        // 使用系统主题配色作为默认背景
        backgroundColor: 'var(--theme-bg-primary, #ffffff)',
        // 移除容器层的自定义背景，以避免覆盖子层动画
        backgroundImage: 'none',
        backgroundSize: 'auto',
        backgroundPosition: 'initial',
        backgroundRepeat: 'repeat',
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* 主题背景层 - 当没有自定义背景时显示 */}
      {!currentBackground && (
        <div 
          className="theme-background-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--theme-bg-secondary, #f8f9fa)',
            backgroundImage: 'var(--theme-gradient, none)',
            opacity: 0.1,
            zIndex: -2,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* 自定义背景图片层 - 当有自定义背景时显示 */}
      {currentBackground && (
        <div 
          className={`chat-background-image ${currentAnimation !== 'none' ? `background-animation-${currentAnimation}` : ''}`}
          style={{
            // 用引号包裹以兼容 data: URL 在 CSS url() 中的解析
            backgroundImage: `url("${currentBackground}")`,
            opacity: currentOpacity / 100
          }}
          data-animation={currentAnimation}
          data-opacity={currentOpacity}
          data-debug={`background: ${!!currentBackground}, animation: ${currentAnimation}, opacity: ${currentOpacity}`}
        />
      )}
      
      {/* 内容层 */}
      <div className="chat-content-layer">
        {children}
      </div>
    </div>
  );
}

// 导出打开模态框的函数，供外部调用
export const openChatBackgroundModal = (callback: () => void) => {
  callback();
}; 