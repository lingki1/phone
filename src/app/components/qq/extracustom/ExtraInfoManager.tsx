'use client';

import { useState, useEffect } from 'react';
import { dataManager } from '../../../utils/dataManager';
import { ExtraInfoConfig } from './types';
import { WorldBook } from '../../../types/chat';

export function useExtraInfoManager(chatId: string, chatName: string, onConfigUpdate: (config: ExtraInfoConfig) => void) {
  const [config, setConfig] = useState<ExtraInfoConfig>({
    enabled: false,
    description: '',
    lastUpdate: Date.now()
  });

  // 从世界书加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        await dataManager.initDB();
        // 查找分类为 'extrainfo' 的世界书
        const worldBooks = await dataManager.getAllWorldBooks();
        const extraInfoWorldBook = worldBooks.find(wb => 
          wb.category === 'extrainfo' && 
          wb.name === `${chatName} 的额外信息`
        );

        if (extraInfoWorldBook) {
          const loadedConfig = {
            enabled: true,
            description: extraInfoWorldBook.content,
            lastUpdate: extraInfoWorldBook.updatedAt
          };
          setConfig(loadedConfig);
          onConfigUpdate(loadedConfig);
        } else {
          const defaultConfig = {
            enabled: false,
            description: '',
            lastUpdate: Date.now()
          };
          setConfig(defaultConfig);
          onConfigUpdate(defaultConfig);
        }
      } catch (error) {
        console.error('Failed to load extra info config from world book:', error);
      }
    };
    
    if (chatName) {
      loadConfig();
    }
  }, [chatId, chatName, onConfigUpdate]);

  // 保存配置到世界书
  const updateConfig = async (newConfig: Partial<ExtraInfoConfig>) => {
    const updatedConfig = {
      ...config,
      ...newConfig,
      lastUpdate: Date.now()
    };
    
    setConfig(updatedConfig);
    onConfigUpdate(updatedConfig);
    
    try {
      await dataManager.initDB();
      
      if (updatedConfig.enabled && updatedConfig.description) {
        // 幂等保存：若已存在相同 chat 的 extrainfo，则更新，否则创建
        const all = await dataManager.getAllWorldBooks();
        const existing = all.find(wb => wb.category === 'extrainfo' && wb.name === `${chatName} 的额外信息`);

        if (existing) {
          const worldBook: WorldBook = {
            ...existing,
            content: updatedConfig.description,
            description: `额外信息功能配置 - ${chatName}`,
            updatedAt: Date.now()
          };
          await dataManager.updateWorldBook(worldBook);
        } else {
          const worldBook: WorldBook = {
            id: `extrainfo_${chatId}_${Date.now()}`,
            name: `${chatName} 的额外信息`,
            content: updatedConfig.description,
            category: 'extrainfo',
            description: `额外信息功能配置 - ${chatName}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          await dataManager.saveWorldBook(worldBook);
        }
      }
    } catch (error) {
      console.error('Failed to save extra info config to world book:', error);
    }
  };

  // 启用额外信息功能
  const enableExtraInfo = (description: string) => {
    updateConfig({ enabled: true, description });
  };

  // 禁用额外信息功能
  const disableExtraInfo = async () => {
    try {
      await dataManager.initDB();
      
              // 删除对应的世界书
      const worldBooks = await dataManager.getAllWorldBooks();
      const extraInfoWorldBook = worldBooks.find(wb => 
        wb.category === 'extrainfo' && 
        wb.name === `${chatName} 的额外信息`
      );

      if (extraInfoWorldBook) {
        await dataManager.deleteWorldBook(extraInfoWorldBook.id);
      }

      const disabledConfig = {
        enabled: false,
        description: '',
        lastUpdate: Date.now()
      };
      setConfig(disabledConfig);
      onConfigUpdate(disabledConfig);
    } catch (error) {
      console.error('Failed to disable extra info:', error);
    }
  };

  // 更新描述
  const updateDescription = (description: string) => {
    updateConfig({ description });
  };

  // 删除世界书条目
  const deleteWorldBookEntry = async (worldBookId: string) => {
    try {
      await dataManager.initDB();
      await dataManager.deleteWorldBook(worldBookId);
      console.log('World book entry deleted successfully:', worldBookId);
      return true;
    } catch (error) {
      console.error('Failed to delete world book entry:', error);
      return false;
    }
  };

  // 获取所有额外信息的世界书条目
  const getAllExtraInfoEntries = async () => {
    try {
      await dataManager.initDB();
      const worldBooks = await dataManager.getAllWorldBooks();
      return worldBooks.filter(wb => wb.category === 'extrainfo');
    } catch (error) {
      console.error('Failed to get extra info entries:', error);
      return [];
    }
  };

  return {
    config,
    enableExtraInfo,
    disableExtraInfo,
    updateDescription,
    deleteWorldBookEntry,
    getAllExtraInfoEntries
  };
}
