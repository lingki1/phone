// 头像组件 - 支持头像ID引用的异步加载
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { avatarManager } from '../../utils/avatarManager';
import { dataManager } from '../../utils/dataManager';

interface AvatarImageProps {
  avatarId?: string;
  fallbackSrc?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function AvatarImage({ 
  avatarId, 
  fallbackSrc = '/avatars/default-avatar.svg',
  alt,
  width,
  height,
  className 
}: AvatarImageProps) {
  const [avatarSrc, setAvatarSrc] = useState<string>(fallbackSrc);

  useEffect(() => {
    const loadAvatar = async () => {
      if (avatarId) {
        try {
          // 首先尝试从avatarManager获取
          let avatar = await avatarManager.getAvatar(avatarId);
          
          // 如果avatarManager中没有，尝试从聊天数据中查找并注册
          if (!avatar) {
            // 解析avatarId获取角色信息
            const parts = avatarId.split('_');
            if (parts.length >= 2) {
              const [type, id] = parts;
              
              if (type === 'character' || type === 'ai') {
                // 获取聊天数据查找对应角色的头像
                const chats = await dataManager.getAllChats();
                const chat = chats.find(c => c.id === id);
                
                if (chat && chat.settings.aiAvatar) {
                  avatar = chat.settings.aiAvatar;
                  // 注册到avatarManager以便下次使用
                  await avatarManager.registerAvatar(avatarId, avatar);
                }
              } else if (type === 'user') {
                // 获取用户头像
                const personalSettings = await dataManager.getPersonalSettings();
                if (personalSettings.userAvatar) {
                  avatar = personalSettings.userAvatar;
                  await avatarManager.registerAvatar(avatarId, avatar);
                }
              }
            }
          }
          
          if (avatar) {
            setAvatarSrc(avatar);
          } else {
            setAvatarSrc(fallbackSrc);
          }
        } catch (error) {
          console.warn('Failed to load avatar:', avatarId, error);
          setAvatarSrc(fallbackSrc);
        }
      } else {
        setAvatarSrc(fallbackSrc);
      }
    };

    loadAvatar();
  }, [avatarId, fallbackSrc]);

  return (
    <Image
      src={avatarSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setAvatarSrc(fallbackSrc)}
    />
  );
}
