'use client';

import { useState, useEffect } from 'react';
import { dataManager } from '../../../utils/dataManager';

export interface ChatStatus {
  isOnline: boolean;
  mood: string;
  location: string;
  outfit: string;
  lastUpdate: number;
}

export interface ChatStatusManagerProps {
  chatId: string;
  onStatusUpdate: (status: ChatStatus) => void;
}

export default function ChatStatusManager({ chatId, onStatusUpdate }: ChatStatusManagerProps) {
  const [, setStatus] = useState<ChatStatus>({
    isOnline: true,
    mood: '心情愉快',
    location: '在家中',
    outfit: '穿着休闲装',
    lastUpdate: Date.now()
  });

  // 从数据库加载状态
  useEffect(() => {
    const loadStatus = async () => {
      try {
        await dataManager.initDB();
        const savedStatus = await dataManager.getChatStatus(chatId);
        if (savedStatus) {
          setStatus(savedStatus);
          onStatusUpdate(savedStatus);
        }
      } catch (error) {
        console.error('Failed to load chat status:', error);
      }
    };
    
    loadStatus();
  }, [chatId, onStatusUpdate]);

  // 更新状态（暂时未使用，保留以备将来扩展）
  // const updateStatus = async (newStatus: Partial<ChatStatus>) => {
  //   const updatedStatus = {
  //     ...status,
  //     ...newStatus,
  //     lastUpdate: Date.now()
  //   };
  //   
  //   setStatus(updatedStatus);
  //   onStatusUpdate(updatedStatus);
  //   
  //   try {
  //     await dataManager.initDB();
  //     await dataManager.saveChatStatus(chatId, updatedStatus);
  //   } catch (error) {
  //     console.error('Failed to save chat status:', error);
  //   }
  // };

  return null; // 这是一个纯逻辑组件，不渲染UI
} 