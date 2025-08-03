'use client';

import React, { useState, useEffect } from 'react';
import { dataManager } from '../../../utils/dataManager';
import './ChatBackgroundAnimations.css';
import './ChatBackgroundManager.css';

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
    <>
      {children}
      
      {/* 背景图片显示 */}
      {currentBackground && (
        <div 
          className={`chat-background-image ${currentAnimation !== 'none' ? `background-animation-${currentAnimation === '3d' ? '3d' : currentAnimation}` : ''}`}
          style={{
            backgroundImage: `url(${currentBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            opacity: 0.3,
            pointerEvents: 'none'
          }}
        />
      )}
      

    </>
  );
}

// 导出打开模态框的函数，供外部调用
export const openChatBackgroundModal = (callback: () => void) => {
  callback();
}; 