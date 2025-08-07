'use client';

import React, { useState, useEffect } from 'react';
import { dataManager } from '../../../utils/dataManager';
import './ChatBackgroundManager.css';
import './ChatBackgroundAnimations.css';

interface ChatBackgroundManagerProps {
  chatId: string;
  onBackgroundChange: (background: string, animation?: string) => void;
  children: React.ReactNode;
}

export default function ChatBackgroundManager({
  chatId,
  onBackgroundChange,
  children
}: ChatBackgroundManagerProps) {
  const [currentBackground, setCurrentBackground] = useState<string>('');
  const [currentAnimation, setCurrentAnimation] = useState<string>('none');

  // 加载背景图片和动画
  useEffect(() => {
    const loadBackground = async () => {
      try {
        await dataManager.initDB();
        const background = await dataManager.getChatBackground(chatId);
        const animation = localStorage.getItem(`chatAnimation_${chatId}`) || 'none';
        setCurrentBackground(background || '');
        setCurrentAnimation(animation);
        onBackgroundChange(background || '', animation);
      } catch (error) {
        console.error('Failed to load chat background:', error);
        // 如果数据库加载失败，尝试从localStorage加载
        const fallbackBackground = localStorage.getItem(`chatBackground_${chatId}`);
        const fallbackAnimation = localStorage.getItem(`chatAnimation_${chatId}`) || 'none';
        if (fallbackBackground) {
          setCurrentBackground(fallbackBackground);
          setCurrentAnimation(fallbackAnimation);
          onBackgroundChange(fallbackBackground, fallbackAnimation);
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
        onBackgroundChange(event.detail.background || '', event.detail.animation || 'none');
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
        backgroundImage: currentBackground ? `url(${currentBackground})` : 'none',
        backgroundSize: currentBackground ? 'cover' : 'auto',
        backgroundPosition: currentBackground ? 'center' : 'initial',
        backgroundRepeat: currentBackground ? 'no-repeat' : 'repeat',
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
            backgroundImage: `url(${currentBackground})`
          }}
          data-animation={currentAnimation}
          data-debug={`background: ${!!currentBackground}, animation: ${currentAnimation}`}
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