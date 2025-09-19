'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import './BlackMarket.css';
import { CharacterCard, WorldBook as BlackMarketWorldBook, BlackMarketItem } from './types';
import { UploadModal } from './UploadModal';
import { blackMarketService } from './blackMarketService';
import Image from 'next/image';
import ItemDetailModal from './ItemDetailModal';
import { CharacterCardParser } from '../qq/characterimport/CharacterCardParser';
import { ChatItem, WorldBook } from '../../types/chat';
import { useI18n } from '../../components/i18n/I18nProvider';

// 防抖动状态hook
const useDebounceState = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: T) => {
    // 如果正在处理中，直接返回
    if (isProcessing) {
      console.log('操作正在进行中，请稍候...');
      return;
    }

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      setIsProcessing(true);
      console.log('开始执行操作...');
      callback(...args);
      // 操作完成后重置状态
      setTimeout(() => {
        setIsProcessing(false);
        console.log('操作完成，可以继续操作');
      }, 1000); // 额外1秒冷却时间
    }, delay);
  }, [callback, delay, isProcessing]);

  return { debouncedCallback, isProcessing };
};

interface BlackMarketProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCharacter?: (character: ChatItem) => void;
  onImportWorldBook?: (worldBook: WorldBook) => void;
}

type TabType = 'all' | 'characters' | 'worldbooks' | 'myuploads';

// 预设提示项类型
interface PresetPrompt {
  name: string;
  role: string;
  content: string;
  marker?: boolean;
  [key: string]: unknown;
}

// 预设数据类型
interface PresetData {
  prompts: PresetPrompt[];
  [key: string]: unknown;
}

// 世界书条目类型
interface WorldBookItem {
  name: string;
  content: string;
  category: string;
  description?: string;
}

// 预设转换工具函数
const convertMarinaraToWorldBooks = (presetData: PresetData): WorldBook[] => {
  const worldBooks: WorldBook[] = [];
  
  if (!presetData.prompts || !Array.isArray(presetData.prompts)) {
    throw new Error('无效的预设格式：缺少prompts数组');
  }

  const roleToCategory = (role: string): string => {
    switch (role) {
      case 'system': return '系统规则';
      case 'user': return '用户角色';
      case 'assistant': return '助手角色';
      default: return '其他';
    }
  };

  const isUsefulPrompt = (prompt: PresetPrompt): boolean => {
    // 排除marker条目
    if (prompt.marker === true) return false;
    
    // 排除空内容
    if (!prompt.content || prompt.content.trim() === '') return false;
    
    // 排除空名称
    if (!prompt.name || prompt.name.trim() === '') return false;
    
    // 排除一些无用的系统条目
    const uselessNames = ['Read-Me', 'Read-Me!', 'ReadMe', '说明', '免责声明'];
    if (uselessNames.some(name => prompt.name.includes(name))) return false;
    
    return true;
  };

  presetData.prompts.forEach((prompt: PresetPrompt) => {
    if (isUsefulPrompt(prompt)) {
      const worldBook: WorldBook = {
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: prompt.name,
        content: prompt.content,
        category: roleToCategory(prompt.role || 'system'),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: `从预设导入: ${prompt.name}`
      };
      worldBooks.push(worldBook);
    }
  });

  return worldBooks;
};

// 世界书数组转换工具函数
const convertWorldBookArray = (worldBookData: WorldBookItem[]): WorldBook[] => {
  const worldBooks: WorldBook[] = [];
  
  if (!Array.isArray(worldBookData)) {
    throw new Error('无效的世界书格式：不是数组');
  }

  worldBookData.forEach((item: WorldBookItem) => {
    if (item.name && item.content && item.category) {
      const worldBook: WorldBook = {
        id: `worldbook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        content: item.content,
        category: item.category,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: item.description || `从世界书导入: ${item.name}`
      };
      worldBooks.push(worldBook);
    }
  });

  return worldBooks;
};

// 检测预设格式
const detectPresetFormat = (data: unknown): 'marinara' | 'worldbook' | 'unknown' => {
  if (data && typeof data === 'object' && 'prompts' in data) {
    const presetData = data as PresetData;
    if (Array.isArray(presetData.prompts)) {
      // 检查是否是Marinara格式
      const firstPrompt = presetData.prompts[0];
      if (firstPrompt && typeof firstPrompt === 'object' && 
          'name' in firstPrompt && 'role' in firstPrompt && 'content' in firstPrompt) {
        return 'marinara';
      }
    }
  }
  
  // 检查是否是世界书数组格式
  if (Array.isArray(data)) {
    const firstItem = data[0];
    if (firstItem && typeof firstItem === 'object' && 
        'name' in firstItem && 'content' in firstItem && 'category' in firstItem) {
      return 'worldbook';
    }
  }
  
  return 'unknown';
};

export default function BlackMarket({ isOpen, onClose, onImportCharacter, onImportWorldBook }: BlackMarketProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [items, setItems] = useState<BlackMarketItem[]>([]);
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [worldbooks, setWorldBooks] = useState<BlackMarketWorldBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
const [tagsExpanded, setTagsExpanded] = useState(false);
const [maxVisibleTags, setMaxVisibleTags] = useState(8);
const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'downloads' | 'name'>('date');
  const [currentUser, setCurrentUser] = useState<{username?: string; role?: string} | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<BlackMarketItem | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 获取当前用户信息（仅在黑市打开时尝试一次，401静默）
  useEffect(() => {
    if (!isOpen) return;
    let aborted = false;
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (aborted) return;
        if (res.status === 401) {
          // 未登录，保持 currentUser 为 null
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data?.success) {
            setCurrentUser(data.user);
          }
        }
      } catch (_error) {
        // 静默失败
      }
    };
    fetchUser();
    return () => { aborted = true; };
  }, [isOpen]);

  // 根据屏幕宽度设置最大可见标签数
  useEffect(() => {
    const updateMaxVisibleTags = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setMaxVisibleTags(3); // 小屏幕显示3个
      } else if (width <= 768) {
        setMaxVisibleTags(5); // 中等屏幕显示5个
      } else {
        setMaxVisibleTags(8); // 大屏幕显示8个
      }
    };

    // 初始化
    updateMaxVisibleTags();

    // 监听窗口大小变化
    window.addEventListener('resize', updateMaxVisibleTags);
    
    return () => {
      window.removeEventListener('resize', updateMaxVisibleTags);
    };
  }, []);

  // 解决Chrome地址栏遮挡问题
  useEffect(() => {
    const updateViewportHeight = () => {
      // 设置CSS变量来动态计算可用高度
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // 初始化
    updateViewportHeight();

    // 监听窗口大小变化和方向变化
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // 处理删除
  const handleDelete = async (item: BlackMarketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!currentUser) {
      alert(t('BlackMarket.alert.loginRequired', '请先登录'));
      return;
    }

    // 权限检查
    const isAuthor = item.author === currentUser.username;
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';
    
    if (!isAuthor && !isAdmin) {
      alert(t('BlackMarket.alert.noPermission', '您没有权限删除此内容'));
      return;
    }

    // 确认删除
    const confirmMessage = isAdmin && !isAuthor 
      ? t('BlackMarket.confirm.deleteWithAuthor', `您确定要删除 "${item.name}" 吗？\n作者：${item.author}`)
      : t('BlackMarket.confirm.delete', `您确定要删除 "${item.name}" 吗？\n此操作不可撤销！`);
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await blackMarketService.deleteItem(item.id);
      if (result.success) {
        alert(t('BlackMarket.alert.deleteSuccess', '删除成功'));
        loadData(); // 重新加载数据
      } else {
        alert(t('BlackMarket.alert.deleteFailedWithMessage', `删除失败：${result.message}`));
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert(t('BlackMarket.alert.deleteFailed', '删除失败，请稍后重试'));
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'characters':
          const charactersData = await blackMarketService.getCharacters();
          setCharacters(charactersData);
          break;
        case 'worldbooks':
          const worldbooksData = await blackMarketService.getWorldBooks();
          setWorldBooks(worldbooksData);
          break;
        case 'myuploads':
          if (currentUser?.username) {
            const myItems = await blackMarketService.getUserUploads(currentUser.username);
            setItems(myItems);
          }
          break;
        default:
          const allItems = await blackMarketService.getAllItems();
          setItems(allItems);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUser?.username]);

  // 加载数据
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // 搜索和过滤逻辑
  const getFilteredItems = () => {
    let filteredItems: BlackMarketItem[] = [];

    switch (activeTab) {
      case 'characters':
        filteredItems = characters.map(char => ({
          id: char.id,
          type: 'character' as const,
          name: char.name,
          description: char.description,
          author: char.author,
          uploadDate: char.uploadDate,
          downloadCount: char.downloadCount,
          fileUrl: char.fileUrl,
          thumbnailUrl: char.thumbnailUrl,
          tags: char.tags || []
        }));
        break;
      case 'worldbooks':
        filteredItems = worldbooks.map(wb => ({
          id: wb.id,
          type: 'worldbook' as const,
          name: wb.name,
          description: wb.description,
          author: wb.author,
          uploadDate: wb.uploadDate,
          downloadCount: wb.downloadCount,
          fileUrl: wb.fileUrl,
          tags: wb.tags || []
        }));
        break;
      default:
        filteredItems = items;
    }

    // 应用搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // 应用标签过滤
    if (selectedTags.length > 0) {
      filteredItems = filteredItems.filter(item =>
        item.tags && selectedTags.some(tag => item.tags!.includes(tag))
      );
    }

         // 排序
     filteredItems.sort((a, b) => {
       switch (sortBy) {
         case 'downloads':
           return b.downloadCount - a.downloadCount; // 按热度排序
         case 'name':
           return a.name.localeCompare(b.name);
         case 'date':
         default:
           return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
       }
     });

    return filteredItems;
  };

      // 获取所有可用标签
    const getAllTags = () => {
      const allItems = [...items, ...characters, ...worldbooks];
      const tagSet = new Set<string>();
      allItems.forEach(item => {
        if (item.tags) {
          item.tags.forEach(tag => tagSet.add(tag));
        }
      });
      return Array.from(tagSet);
    };

  // 取消下载功能
  const handleDownload = async (_item: BlackMarketItem) => {
    alert(t('BlackMarket.alert.downloadRemoved', '已移除下载功能，请使用“导入”来体验内容'));
  };

  // 防抖动的下载处理函数
  const { debouncedCallback: debouncedHandleDownload } = useDebounceState(handleDownload, 300);

  // 处理角色导入
  const handleImportCharacter = async (item: BlackMarketItem) => {
    if (item.type !== 'character') {
      alert(t('BlackMarket.alert.onlyImportCharacter', '只能导入角色卡'));
      return;
    }

    try {
      setIsImporting(true);
      // 获取角色文件
      const response = await fetch(item.fileUrl);
      if (!response.ok) {
        throw new Error(t('BlackMarket.error.fetchCharacter', '无法获取角色文件'));
      }
      
      const blob = await response.blob();
      const file = new File([blob], `${item.name}.png`, { type: 'image/png' });

      // 解析角色卡片
      const result = await CharacterCardParser.parseCharacterCard(file);
      
      if (!result.success || !result.character) {
        alert(t('BlackMarket.alert.characterParseFailed', '角色文件解析失败'));
        return;
      }

      // 验证角色数据
      const validationErrors = CharacterCardParser.validateCharacter(result.character);
      if (validationErrors.length > 0) {
        alert(t('BlackMarket.alert.characterValidationFailed', `角色数据验证失败: ${validationErrors.join(', ')}`));
        return;
      }

      // 获取全局设置中的maxMemory
      const globalSettings = localStorage.getItem('globalSettings');
      const maxMemory = globalSettings ? JSON.parse(globalSettings).maxMemory || 20 : 20;

      // 合并角色描述和人设
      const combinedPersona = [
        result.character.personality,
        result.character.description
      ].filter(Boolean).join('\n\n');

      // 从原始角色数据中提取开场白，并替换 {{user}} 为用户昵称
      const rawFirstMsg = result.character.first_mes?.trim();
      const firstMsg = rawFirstMsg ? rawFirstMsg.replace(/\{\{user\}\}/g, '我') : undefined;

      // 创建新的聊天项目
      const newChat: ChatItem = {
        id: Date.now().toString(),
        name: item.name,
        avatar: result.imageData || item.thumbnailUrl || '/avatars/default-avatar.svg',
        lastMessage: '开始聊天吧！',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isGroup: false,
        unreadCount: 0,
        lastReadTimestamp: Date.now(),
        messages: [],
        persona: combinedPersona,
        settings: {
          aiPersona: combinedPersona,
          myPersona: '用户',
          myNickname: '用户',
          maxMemory: maxMemory,
          aiAvatar: result.imageData || item.thumbnailUrl || '/avatars/default-avatar.svg',
          myAvatar: '/avatars/user-avatar.svg',
          background: 'default',
          theme: 'light',
          fontSize: 14,
          customCss: '',
          linkedWorldBookIds: [],
          aiAvatarLibrary: [],
          aiAvatarFrame: '',
          myAvatarFrame: '',
          firstMsg: firstMsg,
          // 使用默认API配置
          proxyUrl: '',
          apiKey: '',
          model: ''
        }
      };

      // 调用导入回调
      console.log('黑市导入 - 准备调用导入回调:', {
        onImportCharacter: !!onImportCharacter,
        characterName: newChat.name,
        characterId: newChat.id
      });
      
      if (onImportCharacter) {
        try {
          await onImportCharacter(newChat);
          console.log('黑市导入 - 导入回调执行成功');
          alert(t('BlackMarket.alert.characterImportSuccess', '角色导入成功！'));
          // 导入成功后增加热度
          await blackMarketService.incrementHeat(item.id);
          loadData();
        } catch (error) {
          console.error('黑市导入 - 导入回调执行失败:', error);
          alert(t('BlackMarket.alert.importFailed', '导入失败，请稍后重试'));
        }
      } else {
        console.error('黑市导入 - onImportCharacter 未定义');
        alert(t('BlackMarket.alert.importNotConfigured', '导入功能未配置'));
      }
    } catch (error) {
      console.error('导入角色失败:', error);
      alert(t('BlackMarket.alert.importCharacterFailed', '导入角色失败，请稍后重试'));
    } finally {
      setIsImporting(false);
    }
  };

  // 防抖动的角色导入处理函数
  const { debouncedCallback: debouncedHandleImportCharacter, isProcessing: isImportingCharacter } = useDebounceState(handleImportCharacter, 300);

  // 处理世界书导入
  const handleImportWorldBook = async (item: BlackMarketItem) => {
    if (item.type !== 'worldbook') {
      alert(t('BlackMarket.alert.onlyImportWorldBook', '只能导入世界书'));
      return;
    }

    try {
      setIsImporting(true);
      // 使用API端点获取世界书文件内容
      const response = await fetch(`/api/blackmarket/items/${item.id}/content`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(t('BlackMarket.error.fetchWorldBook', '无法获取世界书文件'));
      }
      
      const jsonData = await response.json();
      
      // 检测预设格式并转换
      const format = detectPresetFormat(jsonData);
      
      if (format === 'marinara') {
        // 转换Marinara预设为世界书格式
        const worldBooks = convertMarinaraToWorldBooks(jsonData);
        
        if (worldBooks.length === 0) {
          alert(t('BlackMarket.alert.worldBookNoData', '世界书中没有找到有效的数据'));
          return;
        }

        // 调用导入回调
        console.log('黑市导入世界书 - 准备调用导入回调:', {
          onImportWorldBook: !!onImportWorldBook,
          worldBookCount: worldBooks.length
        });
        
        if (onImportWorldBook) {
          try {
            // 导入第一个世界书（或者可以询问用户选择）
            await onImportWorldBook(worldBooks[0]);
            console.log('黑市导入世界书 - 导入回调执行成功');
            alert(t('BlackMarket.alert.worldBookImportSuccess', `世界书导入成功！导入了 ${worldBooks.length} 个条目`));
            // 导入成功后增加热度
            await blackMarketService.incrementHeat(item.id);
            loadData();
          } catch (error) {
            console.error('黑市导入世界书 - 导入回调执行失败:', error);
            alert(t('BlackMarket.alert.importFailed', '导入失败，请稍后重试'));
          }
        } else {
          console.error('黑市导入世界书 - onImportWorldBook 未定义');
          alert(t('BlackMarket.alert.importNotConfigured', '导入功能未配置'));
        }
      } else if (format === 'worldbook') {
        // 转换世界书数组格式
        const worldBooks = convertWorldBookArray(jsonData as WorldBookItem[]);
        
        if (worldBooks.length === 0) {
          alert(t('BlackMarket.alert.worldBookNoData', '世界书中没有找到有效的数据'));
          return;
        }

        // 调用导入回调
        console.log('黑市导入世界书 - 准备调用导入回调:', {
          onImportWorldBook: !!onImportWorldBook,
          worldBookCount: worldBooks.length
        });
        
        if (onImportWorldBook) {
          try {
            // 导入第一个世界书（或者可以询问用户选择）
            await onImportWorldBook(worldBooks[0]);
            console.log('黑市导入世界书 - 导入回调执行成功');
            alert(t('BlackMarket.alert.worldBookImportSuccess', `世界书导入成功！导入了 ${worldBooks.length} 个条目`));
            // 导入成功后增加热度
            await blackMarketService.incrementHeat(item.id);
            loadData();
          } catch (error) {
            console.error('黑市导入世界书 - 导入回调执行失败:', error);
            alert(t('BlackMarket.alert.importFailed', '导入失败，请稍后重试'));
          }
        } else {
          console.error('黑市导入世界书 - onImportWorldBook 未定义');
          alert(t('BlackMarket.alert.importNotConfigured', '导入功能未配置'));
        }
      } else {
        alert(t('BlackMarket.alert.worldBookFormatUnsupported', '不支持的世界书格式，请使用Marinara预设格式或世界书数组格式'));
      }
    } catch (error) {
      console.error('导入世界书失败:', error);
      alert(t('BlackMarket.alert.importWorldBookFailed', '导入世界书失败，请稍后重试'));
    } finally {
      setIsImporting(false);
    }
  };

  // 防抖动的世界书导入处理函数
  const { debouncedCallback: debouncedHandleImportWorldBook, isProcessing: isImportingWorldBook } = useDebounceState(handleImportWorldBook, 300);

  if (!isOpen) return null;

  return (
    <div className="bm-blackmarket-modal">
      <div className="bm-blackmarket-container">
        <div className="blackmarket-header bm-head">
          <div className="bm-head-left">
            <button className="blackmarket-back-button" onClick={onClose} title={t('BlackMarket.header.back', '返回桌面')}>
              ← 
            </button>
            <h2>{t('BlackMarket.title', '黑市')}</h2>
          </div>
          <div className="bm-head-actions">
            <button className="blackmarket-upload-button" onClick={() => setIsUploadModalOpen(true)} disabled={!currentUser || isImporting}>{t('BlackMarket.actions.upload', '上传')}</button>
          </div>
        </div>

        <div className="blackmarket-nav bm-categories">
          <div className="blackmarket-tabs">
            <button
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => !isImporting && setActiveTab('all')}
              disabled={isImporting}
            >
              {t('BlackMarket.tabs.all', '全部')}
            </button>
            <button
              className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
              onClick={() => !isImporting && setActiveTab('characters')}
              disabled={isImporting}
            >
              {t('BlackMarket.tabs.characters', '角色卡')}
            </button>
            <button
              className={`tab-button ${activeTab === 'worldbooks' ? 'active' : ''}`}
              onClick={() => !isImporting && setActiveTab('worldbooks')}
              disabled={isImporting}
            >
              {t('BlackMarket.tabs.worldbooks', '世界书')}
            </button>
            <button
              className={`tab-button ${activeTab === 'myuploads' ? 'active' : ''}`}
              onClick={() => !isImporting && setActiveTab('myuploads')}
              disabled={isImporting}
            >
              {t('BlackMarket.tabs.myuploads', '我的上传')}
            </button>
          </div>
        </div>

        <div className="blackmarket-filters">
          <div className="blackmarket-search-container">
            <input
              type="text"
              placeholder={t('BlackMarket.search.placeholder', '搜索名称、描述、作者或标签...')}
              value={searchQuery}
              onChange={(e) => !isImporting && setSearchQuery(e.target.value)}
              className="blackmarket-search-input"
              disabled={isImporting}
            />
          </div>

                      <div className="blackmarket-tags-sort-row">
              <div className="blackmarket-tags-filter">
                {getAllTags().slice(0, tagsExpanded ? undefined : maxVisibleTags).map(tag => (
                  <button
                    key={tag}
                    className={`blackmarket-tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => {
                      if (isImporting) return;
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                    disabled={isImporting}
                  >
                    {tag}
                  </button>
                ))}
                {getAllTags().length > maxVisibleTags && (
                  <button
                    className="blackmarket-tags-toggle"
                    onClick={() => !isImporting && setTagsExpanded(!tagsExpanded)}
                    disabled={isImporting}
                  >
                    {tagsExpanded ? t('BlackMarket.tags.collapse', '收起') : t('BlackMarket.tags.expand', `展开 (+${getAllTags().length - maxVisibleTags})`)}
                  </button>
                )}
                {/* 开发模式调试信息 */}
                {process.env.NODE_ENV === 'development' && (
                  <span className="blackmarket-debug-info" style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
                    {t('BlackMarket.debug.tagsShown', `显示: ${Math.min(getAllTags().length, tagsExpanded ? getAllTags().length : maxVisibleTags)}/${getAllTags().length}`)}
                  </span>
                )}
              </div>

                         <select
               value={sortBy}
               onChange={(e) => !isImporting && setSortBy(e.target.value as 'date' | 'downloads' | 'name')}
               className="blackmarket-sort-select"
               disabled={isImporting}
             >
               <option value="date">{t('BlackMarket.sort.date', '按时间')}</option>
               <option value="downloads">{t('BlackMarket.sort.downloads', '按热度')}</option>
               <option value="name">{t('BlackMarket.sort.name', '按名称')}</option>
             </select>
          </div>
        </div>

        <div className="blackmarket-content">
          {loading ? (
            <div className="blackmarket-loading-container">
              <div className="blackmarket-loading-spinner"></div>
              <p>{t('BlackMarket.loading', '加载中...')}</p>
            </div>
          ) : (
            <div className="blackmarket-items-grid">
              {getFilteredItems().map(item => (
                <div key={item.id} className={`item-card ${item.type}`} onClick={() => { if (!isImporting) { setDetailItem(item); setDetailOpen(true); } }}>
                  <div className="item-header item-header-media">
                    <div className="item-thumbnail-wrap">
                      {item.thumbnailUrl ? (
                        <Image 
                          src={item.thumbnailUrl} 
                          alt={item.name} 
                          className="item-thumbnail" 
                          width={600}
                          height={1066}
                        />
                      ) : item.type === 'worldbook' ? (
                        <div className="item-worldbook-preview">
                          <div className="item-worldbook-title">{item.name}</div>
                        </div>
                      ) : null}
                      
                      {/* 左上角：类型徽章 */}
                      <div className="media-top-badge">
                        <div className="item-type-badge">
                          {item.type === 'character' ? '👤' : '📚'} 
                          {item.type === 'character' ? t('BlackMarket.type.character', '角色卡') : t('BlackMarket.type.worldbook', '世界书')}
                        </div>
                      </div>
                      
                      {/* 右上角：日期和热度 */}
                      <div className="item-meta-info">
                        <span className="item-date">{new Date(item.uploadDate).toLocaleDateString()}</span>
                        <span className="item-heat">🔥 {item.downloadCount}</span>
                      </div>
                      
                                             {/* 操作按钮 - 放在底部中央 */}
                       <div className="media-download">
                         {item.type === 'character' && onImportCharacter && (
                           <button 
                             className="import-button" 
                             onClick={(e) => {
                               e.stopPropagation();
                               if (isImporting) return;
                               setIsImporting(true);
                               debouncedHandleImportCharacter(item);
                             }}
                             title={t('BlackMarket.import.toChat', '导入到聊天列表')}
                             disabled={isImporting || isImportingCharacter}
                           >
                             {isImporting || isImportingCharacter ? t('BlackMarket.import.importing', '导入中...') : t('BlackMarket.import.button', '导入')}
                           </button>
                         )}
                         {item.type === 'worldbook' && onImportWorldBook && (
                           <button 
                             className="import-button" 
                             onClick={(e) => {
                               e.stopPropagation();
                               if (isImporting) return;
                               setIsImporting(true);
                               debouncedHandleImportWorldBook(item);
                             }}
                             title={t('BlackMarket.import.toWorldBook', '导入到世界书')}
                             disabled={isImporting || isImportingWorldBook}
                           >
                             {isImporting || isImportingWorldBook ? t('BlackMarket.import.importing', '导入中...') : t('BlackMarket.import.button', '导入')}
                           </button>
                         )}
                         {/* 下载按钮已移除 */}
                         {(currentUser?.username === item.author || 
                           currentUser?.role === 'admin' || 
                           currentUser?.role === 'super_admin') && (
                           <button 
                             className="delete-button" 
                             onClick={(e) => handleDelete(item, e)}
                             title={currentUser?.username === item.author ? t('BlackMarket.delete.mine', '删除我的内容') : t('BlackMarket.delete.admin', '管理员删除')}
                           >
                             🗑️
                           </button>
                         )}
                       </div>
                       
                       {/* 角色卡名称 - 放在操作按钮上方 */}
                       <div className="item-name-overlay">
                         <div className="item-name-text">{item.name}</div>
                       </div>
                       
                       <div className="media-bottom-bar">
                         {/* 移除原来的meta信息，因为已经移到右上角 */}
                       </div>
                    </div>
                  </div>
                  
                  {/* 按需隐藏卡片下方的作者/时间等信息，改为悬浮层显示 */}

                  <div className="item-actions" style={{ display: 'none' }}></div>
                </div>
              ))}
            </div>
          )}

          {!loading && getFilteredItems().length === 0 && (
            <div className="blackmarket-empty-state">
              <p>{t('BlackMarket.empty.title', '😔 没有找到相关内容')}</p>
              <p>{t('BlackMarket.empty.hint', '尝试调整搜索条件或上传新的内容')}</p>
            </div>
          )}
        </div>

        {/* 上传弹窗 */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={() => {
            setIsUploadModalOpen(false);
            loadData();
          }}
        />

        {/* 详情弹窗 */}
        <ItemDetailModal
          open={detailOpen}
          item={detailItem}
          onClose={() => setDetailOpen(false)}
          onDownload={debouncedHandleDownload}
          onImportCharacter={debouncedHandleImportCharacter}
          onImportWorldBook={debouncedHandleImportWorldBook}
          onDelete={handleDelete}
          canDelete={detailItem ? (
            currentUser?.username === detailItem.author || 
            currentUser?.role === 'admin' || 
            currentUser?.role === 'super_admin'
          ) : false}
          busy={isImporting}
        />
      </div>
    </div>
  );
}
