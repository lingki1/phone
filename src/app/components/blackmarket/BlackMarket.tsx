'use client';

import { useState, useEffect, useCallback } from 'react';
import './BlackMarket.css';
import { CharacterCard, WorldBook as BlackMarketWorldBook, BlackMarketItem } from './types';
import { UploadModal } from './UploadModal';
import { blackMarketService } from './blackMarketService';
import Image from 'next/image';
import ItemDetailModal from './ItemDetailModal';
import { CharacterCardParser } from '../qq/characterimport/CharacterCardParser';
import { ChatItem, WorldBook } from '../../types/chat';


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
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [items, setItems] = useState<BlackMarketItem[]>([]);
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [worldbooks, setWorldBooks] = useState<BlackMarketWorldBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'downloads' | 'name'>('date');
  const [currentUser, setCurrentUser] = useState<{username?: string} | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<BlackMarketItem | null>(null);

  // 获取当前用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.success) {
            setCurrentUser(data.user);
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };
    fetchUser();
  }, []);

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
          tags: char.tags
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
          tags: wb.tags
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
          return b.downloadCount - a.downloadCount;
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

  // 处理下载
  const handleDownload = async (item: BlackMarketItem) => {
    try {
      await blackMarketService.downloadItem(item.id, item.type);
      // 更新下载数量
      loadData();
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  };

  // 处理角色导入
  const handleImportCharacter = async (item: BlackMarketItem) => {
    if (item.type !== 'character') {
      alert('只能导入角色卡');
      return;
    }

    try {
      // 获取角色文件
      const response = await fetch(item.fileUrl);
      if (!response.ok) {
        throw new Error('无法获取角色文件');
      }
      
      const blob = await response.blob();
      const file = new File([blob], `${item.name}.png`, { type: 'image/png' });

      // 解析角色卡片
      const result = await CharacterCardParser.parseCharacterCard(file);
      
      if (!result.success || !result.character) {
        alert('角色文件解析失败');
        return;
      }

      // 验证角色数据
      const validationErrors = CharacterCardParser.validateCharacter(result.character);
      if (validationErrors.length > 0) {
        alert(`角色数据验证失败: ${validationErrors.join(', ')}`);
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
          alert('角色导入成功！');
        } catch (error) {
          console.error('黑市导入 - 导入回调执行失败:', error);
          alert('导入失败，请稍后重试');
        }
      } else {
        console.error('黑市导入 - onImportCharacter 未定义');
        alert('导入功能未配置');
      }
    } catch (error) {
      console.error('导入角色失败:', error);
      alert('导入角色失败，请稍后重试');
    }
  };

  // 处理世界书导入
  const handleImportWorldBook = async (item: BlackMarketItem) => {
    if (item.type !== 'worldbook') {
      alert('只能导入世界书');
      return;
    }

    try {
      // 使用API端点获取世界书文件内容
      const response = await fetch(`/api/blackmarket/items/${item.id}/content`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('无法获取世界书文件');
      }
      
      const jsonData = await response.json();
      
      // 检测预设格式并转换
      const format = detectPresetFormat(jsonData);
      
      if (format === 'marinara') {
        // 转换Marinara预设为世界书格式
        const worldBooks = convertMarinaraToWorldBooks(jsonData);
        
        if (worldBooks.length === 0) {
          alert('世界书中没有找到有效的数据');
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
            alert(`世界书导入成功！导入了 ${worldBooks.length} 个条目`);
          } catch (error) {
            console.error('黑市导入世界书 - 导入回调执行失败:', error);
            alert('导入失败，请稍后重试');
          }
        } else {
          console.error('黑市导入世界书 - onImportWorldBook 未定义');
          alert('导入功能未配置');
        }
      } else if (format === 'worldbook') {
        // 转换世界书数组格式
        const worldBooks = convertWorldBookArray(jsonData as WorldBookItem[]);
        
        if (worldBooks.length === 0) {
          alert('世界书中没有找到有效的数据');
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
            alert(`世界书导入成功！导入了 ${worldBooks.length} 个条目`);
          } catch (error) {
            console.error('黑市导入世界书 - 导入回调执行失败:', error);
            alert('导入失败，请稍后重试');
          }
        } else {
          console.error('黑市导入世界书 - onImportWorldBook 未定义');
          alert('导入功能未配置');
        }
      } else {
        alert('不支持的世界书格式，请使用Marinara预设格式或世界书数组格式');
      }
    } catch (error) {
      console.error('导入世界书失败:', error);
      alert('导入世界书失败，请稍后重试');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bm-blackmarket-modal">
      <div className="bm-blackmarket-container">
        <div className="blackmarket-header bm-head">
          <div className="bm-head-left">
            <button className="blackmarket-back-button" onClick={onClose} title="返回桌面">
              ← 
            </button>
            <h2>🏪 黑市</h2>
          </div>
          <div className="bm-head-actions">
            <button className="blackmarket-upload-button" onClick={() => setIsUploadModalOpen(true)} disabled={!currentUser}>📤 上传</button>
          </div>
        </div>

        <div className="blackmarket-nav bm-categories">
          <div className="blackmarket-tabs">
            <button
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              全部
            </button>
            <button
              className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
              onClick={() => setActiveTab('characters')}
            >
              角色卡
            </button>
            <button
              className={`tab-button ${activeTab === 'worldbooks' ? 'active' : ''}`}
              onClick={() => setActiveTab('worldbooks')}
            >
              世界书
            </button>
            <button
              className={`tab-button ${activeTab === 'myuploads' ? 'active' : ''}`}
              onClick={() => setActiveTab('myuploads')}
            >
              我的上传
            </button>
          </div>
        </div>

        <div className="blackmarket-filters">
          <div className="blackmarket-search-container">
            <input
              type="text"
              placeholder="搜索名称、描述、作者或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="blackmarket-search-input"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'downloads' | 'name')}
            className="blackmarket-sort-select"
          >
            <option value="date">按时间排序</option>
            <option value="downloads">按下载量排序</option>
            <option value="name">按名称排序</option>
          </select>

          <div className="blackmarket-tags-filter">
            {getAllTags().slice(0, 5).map(tag => (
              <button
                key={tag}
                className={`blackmarket-tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  );
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="blackmarket-content">
          {loading ? (
            <div className="blackmarket-loading-container">
              <div className="blackmarket-loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : (
            <div className="blackmarket-items-grid">
              {getFilteredItems().map(item => (
                <div key={item.id} className={`item-card ${item.type}`} onClick={() => { setDetailItem(item); setDetailOpen(true); }}>
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
                      <div className="media-top-badge">
                        <div className="item-type-badge">
                          {item.type === 'character' ? '👤' : '📚'} 
                          {item.type === 'character' ? '角色卡' : '世界书'}
                        </div>
                      </div>
                      <div className="media-bottom-bar">
                        <div className="meta">
                          <span>{new Date(item.uploadDate).toLocaleDateString()}</span>
                          <span>📥 {item.downloadCount}</span>
                        </div>
                      </div>
                      <div className="media-download">
                        {item.type === 'character' && onImportCharacter && (
                          <button 
                            className="import-button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImportCharacter(item);
                            }}
                            title="导入到聊天列表"
                          >
                            导入
                          </button>
                        )}
                        {item.type === 'worldbook' && onImportWorldBook && (
                          <button 
                            className="import-button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImportWorldBook(item);
                            }}
                            title="导入到世界书"
                          >
                            导入
                          </button>
                        )}
                        <button 
                          className="download-button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                        >
                          下载
                        </button>
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
              <p>😔 没有找到相关内容</p>
              <p>尝试调整搜索条件或上传新的内容</p>
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
          onDownload={handleDownload}
          onImportCharacter={handleImportCharacter}
          onImportWorldBook={handleImportWorldBook}
        />
      </div>
    </div>
  );
}
