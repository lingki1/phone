'use client';

import { useState, useEffect } from 'react';
import ChatListHeader from './ChatListHeader';
import ChatList from './ChatList';
import ApiSettingsModal from './ApiSettingsModal';
import ChatInterface from './ChatInterface';
import CreateGroupModal from './CreateGroupModal';
import EditFriendModal from './EditFriendModal';
import PersonalSettingsModal from './PersonalSettingsModal';
import { WorldBookListPage, WorldBookAssociationModal } from './worldbook';
import BottomNavigation from './BottomNavigation';
import { ChatItem, ApiConfig } from '../../types/chat';
import { dataManager } from '../../utils/dataManager';
import { presetManager } from '../../utils/presetManager';
import PageTransitionManager from '../utils/PageTransitionManager';
import CharacterImportModal from './characterimport/CharacterImportModal';
import './ChatListPage.css';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface PresetConfig {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK?: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences?: string[];
  logitBias?: Record<string, number>;
  responseFormat?: 'text' | 'json_object';
  seed?: number;
  user?: string;
}

interface ChatListPageProps {
  onBackToDesktop?: () => void;
}

export default function ChatListPage({ onBackToDesktop }: ChatListPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'single' | 'group'>('all');
  const [activeView, setActiveView] = useState<string>('messages');
  const [currentScreen, setCurrentScreen] = useState<'list' | 'chat' | 'worldbook'>('list');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // 模态框状态
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showPersonalSettings, setShowPersonalSettings] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friendModalMode, setFriendModalMode] = useState<'create' | 'edit'>('create');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCharacterImport, setShowCharacterImport] = useState(false);
  const [editingChat, setEditingChat] = useState<ChatItem | null>(null);
  
  // 世界书相关状态
  const [showWorldBookAssociation, setShowWorldBookAssociation] = useState(false);
  const [associatingChatId, setAssociatingChatId] = useState<string | null>(null);
  
  // API配置状态
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    proxyUrl: '',
    apiKey: '',
    model: ''
  });
  
  // 个人设置状态
  const [personalSettings, setPersonalSettings] = useState<PersonalSettings>({
    userAvatar: '/avatars/user-avatar.svg',
    userNickname: '用户',
    userBio: ''
  });
  
  // 预设状态
  const [currentPreset, setCurrentPreset] = useState<PresetConfig | null>(null);
  
  // 聊天数据状态
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');

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

  // 监听预设变更
  useEffect(() => {
    const handlePresetChange = async () => {
      try {
        const preset = await presetManager.getCurrentPreset();
        setCurrentPreset(preset);
      } catch (error) {
        console.error('Failed to update preset:', error);
      }
    };

    window.addEventListener('presetChanged', handlePresetChange);
    
    return () => {
      window.removeEventListener('presetChanged', handlePresetChange);
    };
  }, []);

  // 监听API配置变更
  useEffect(() => {
    const handleApiConfigChange = async () => {
      try {
        console.log('ChatListPage - 收到API配置变更事件，重新加载配置');
        // 重新加载API配置
        const savedApiConfig = await dataManager.getApiConfig();
        console.log('ChatListPage - 重新加载API配置:', {
          proxyUrl: savedApiConfig.proxyUrl,
          apiKey: savedApiConfig.apiKey ? '已设置' : '未设置',
          model: savedApiConfig.model
        });
        setApiConfig(savedApiConfig);
        
        // 同时更新所有现有聊天的API配置
        const updatedChats = chats.map(chat => ({
          ...chat,
          settings: {
            ...chat.settings,
            proxyUrl: savedApiConfig.proxyUrl,
            apiKey: savedApiConfig.apiKey,
            model: savedApiConfig.model
          }
        }));
        
        setChats(updatedChats);
        
        // 保存更新后的聊天到数据库
        for (const chat of updatedChats) {
          try {
            await dataManager.saveChat(chat);
          } catch (error) {
            console.error(`Failed to update chat ${chat.id} API config:`, error);
          }
        }
        
        console.log('ChatListPage - 已更新所有聊天的API配置');
      } catch (error) {
        console.error('Failed to reload API config:', error);
        // 回退到localStorage
        const savedApiConfig = localStorage.getItem('apiConfig');
        if (savedApiConfig) {
          const parsedConfig = JSON.parse(savedApiConfig);
          console.log('ChatListPage - 从localStorage重新加载API配置:', {
            proxyUrl: parsedConfig.proxyUrl,
            apiKey: parsedConfig.apiKey ? '已设置' : '未设置',
            model: parsedConfig.model
          });
          setApiConfig(parsedConfig);
        }
      }
    };

    window.addEventListener('apiConfigChanged', handleApiConfigChange);
    
    return () => {
      window.removeEventListener('apiConfigChanged', handleApiConfigChange);
    };
  }, [chats]); // 添加chats依赖

  // 监听显示消息页面事件
  useEffect(() => {
    const handleShowMessages = () => {
      console.log('ChatListPage - 收到显示消息页面事件');
      setActiveView('messages');
      setCurrentScreen('list');
      console.log('ChatListPage - 已设置activeView为messages，currentScreen为list');
    };

    console.log('ChatListPage - 添加事件监听器');
    window.addEventListener('showMessages', handleShowMessages);
    
    return () => {
      console.log('ChatListPage - 移除事件监听器');
      window.removeEventListener('showMessages', handleShowMessages);
    };
  }, []);
  


  // 初始化数据库和加载数据
  useEffect(() => {
    const initData = async () => {
      try {
        await dataManager.initDB();
        
        // 加载API配置
        try {
          const savedApiConfig = await dataManager.getApiConfig();
          console.log('ChatListPage - 从数据库加载API配置:', {
            proxyUrl: savedApiConfig.proxyUrl,
            apiKey: savedApiConfig.apiKey ? '已设置' : '未设置',
            model: savedApiConfig.model
          });
          setApiConfig(savedApiConfig);
        } catch (error) {
          console.error('Failed to load API config from database:', error);
          // 回退到localStorage
          const savedApiConfig = localStorage.getItem('apiConfig');
          if (savedApiConfig) {
            const parsedConfig = JSON.parse(savedApiConfig);
            console.log('ChatListPage - 从localStorage加载API配置:', {
              proxyUrl: parsedConfig.proxyUrl,
              apiKey: parsedConfig.apiKey ? '已设置' : '未设置',
              model: parsedConfig.model
            });
            setApiConfig(parsedConfig);
          }
        }
        
        // 加载个人设置
        try {
          const savedPersonalSettings = await dataManager.getPersonalSettings();
          setPersonalSettings(savedPersonalSettings);
        } catch (error) {
          console.error('Failed to load personal settings from database:', error);
          // 回退到localStorage
          const savedPersonalSettings = localStorage.getItem('personalSettings');
          if (savedPersonalSettings) {
            setPersonalSettings(JSON.parse(savedPersonalSettings));
          }
        }
        
        // 加载预设
        try {
          const preset = await presetManager.getCurrentPreset();
          setCurrentPreset(preset);
        } catch (error) {
          console.error('Failed to load preset:', error);
        }
        
        // 加载聊天数据
        const savedChats = await dataManager.getAllChats();
        setChats(savedChats);
      } catch (error) {
        console.error('Failed to initialize data:', error);
        // 回退到localStorage
        const savedChats = localStorage.getItem('chats');
        if (savedChats) {
          setChats(JSON.parse(savedChats));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  // 保存API配置
  const handleSaveApiConfig = async (config: ApiConfig) => {
    console.log('ChatListPage - 保存API配置:', {
      proxyUrl: config.proxyUrl,
      apiKey: config.apiKey ? '已设置' : '未设置',
      model: config.model
    });
    
    setApiConfig(config);
    try {
      await dataManager.saveApiConfig(config);
      console.log('ChatListPage - API配置已保存到数据库');
    } catch (error) {
      console.error('Failed to save API config:', error);
      localStorage.setItem('apiConfig', JSON.stringify(config));
      console.log('ChatListPage - API配置已保存到localStorage');
    }
  };

  // 保存个人设置
  const handleSavePersonalSettings = async (settings: PersonalSettings) => {
    setPersonalSettings(settings);
    try {
      await dataManager.savePersonalSettings(settings);
    } catch (error) {
      console.error('Failed to save personal settings to database:', error);
      // 回退到localStorage
      localStorage.setItem('personalSettings', JSON.stringify(settings));
    }
  };

  // 添加好友
  const handleAddFriend = async (name: string, persona: string, avatar?: string) => {
    // 获取全局设置中的maxMemory
    const globalSettings = localStorage.getItem('globalSettings');
    const maxMemory = globalSettings ? JSON.parse(globalSettings).maxMemory || 20 : 20;
    
    const newChat: ChatItem = {
      id: Date.now().toString(),
      name,
      avatar: avatar || '/avatars/default-avatar.svg',
      lastMessage: '开始聊天吧！',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isGroup: false,
      messages: [],
      persona,
      settings: {
        aiPersona: persona,
        myPersona: personalSettings.userBio || '用户',
        myNickname: personalSettings.userNickname,
        maxMemory: maxMemory,
        aiAvatar: avatar || '/avatars/default-avatar.svg',
        myAvatar: personalSettings.userAvatar,
        background: 'default',
        theme: 'light',
        fontSize: 14,
        customCss: '',
        linkedWorldBookIds: [],
        aiAvatarLibrary: [],
        aiAvatarFrame: '',
        myAvatarFrame: '',
        // 使用当前API配置
        proxyUrl: apiConfig.proxyUrl,
        apiKey: apiConfig.apiKey,
        model: apiConfig.model
      }
    };
    
    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    
    try {
      await dataManager.saveChat(newChat);
    } catch (error) {
      console.error('Failed to save new chat:', error);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }
  };

  // 创建群聊
  const handleCreateGroup = async (group: ChatItem) => {
    const updatedChats = [...chats, group];
    setChats(updatedChats);
    
    try {
      await dataManager.saveChat(group);
    } catch (error) {
      console.error('Failed to save new group:', error);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }
  };

  // 打开聊天
  const handleOpenChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setCurrentScreen('chat');
  };

  // 处理底部导航切换
  const handleViewChange = (view: string) => {
    // 防止重复点击同一个视图
    if (activeView === view) return;
    
    setActiveView(view);
    if (view === 'messages') {
      setCurrentScreen('list');
    } else if (view === 'me') {
      // 跳转到个人页面
      window.dispatchEvent(new CustomEvent('navigateToMe'));
    } else if (view === 'moments') {
      // 跳转到动态页面
      if (onBackToDesktop) {
        onBackToDesktop();
        // 延迟一下再打开动态应用，确保回到桌面
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openApp', { detail: 'discover' }));
        }, 100);
      }
    }
  };

  // 更新聊天数据
  const handleUpdateChat = async (updatedChat: ChatItem) => {
    const updatedChats = chats.map(chat => 
      chat.id === updatedChat.id ? updatedChat : chat
    );
    setChats(updatedChats);
    
    try {
      await dataManager.saveChat(updatedChat);
    } catch (error) {
      console.error('Failed to update chat:', error);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }
  };



  // 删除聊天
  const handleDeleteChat = async (chatId: string) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    try {
      await dataManager.deleteChat(chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }
  };

  // 编辑聊天
  const handleEditChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      if (chat.isGroup) {
        // 群聊编辑：打开创建群聊模态框进行编辑
        setEditingChat(chat);
        setShowCreateGroup(true);
      } else {
        // 单聊编辑：打开好友编辑模态框
        setEditingChat(chat);
        setFriendModalMode('edit');
        setShowFriendModal(true);
      }
    }
  };

  // 更新好友信息
  const handleUpdateFriend = (updatedChat: ChatItem) => {
    handleUpdateChat(updatedChat);
    setShowFriendModal(false);
    setEditingChat(null);
  };

  // 打开添加好友模态框
  const handleOpenAddFriend = () => {
    setFriendModalMode('create');
    setShowFriendModal(true);
  };

  // 打开角色导入模态框
  const handleOpenCharacterImport = () => {
    console.log('ChatListPage - 打开角色导入模态框，当前API配置:', {
      proxyUrl: apiConfig.proxyUrl,
      apiKey: apiConfig.apiKey ? '已设置' : '未设置',
      model: apiConfig.model
    });
    setShowCharacterImport(true);
  };

  // 处理角色导入
  const handleImportCharacter = async (character: ChatItem) => {
    const updatedChats = [...chats, character];
    setChats(updatedChats);
    
    try {
      await dataManager.saveChat(character);
    } catch (error) {
      console.error('Failed to save imported character:', error);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }
  };

  // 关闭好友模态框
  const handleCloseFriendModal = () => {
    setShowFriendModal(false);
    setEditingChat(null);
  };

  // 打开世界书管理页面
  const handleOpenWorldBook = () => {
    setCurrentScreen('worldbook');
  };

  // 打开世界书关联弹窗
  const handleAssociateWorldBook = (chatId: string) => {
    setAssociatingChatId(chatId);
    setShowWorldBookAssociation(true);
  };

  // 保存世界书关联
  const handleSaveWorldBookAssociation = async (linkedIds: string[]) => {
    if (!associatingChatId) return;

    const chat = chats.find(c => c.id === associatingChatId);
    if (!chat) return;

    const updatedChat = {
      ...chat,
      settings: {
        ...chat.settings,
        linkedWorldBookIds: linkedIds
      }
    };

    await handleUpdateChat(updatedChat);
    setShowWorldBookAssociation(false);
    setAssociatingChatId(null);
  };

  // 关闭世界书关联弹窗
  const handleCloseWorldBookAssociation = () => {
    setShowWorldBookAssociation(false);
    setAssociatingChatId(null);
  };

  // 根据当前选中的标签和搜索查询过滤聊天列表，并按最近聊天时间排序
  const filteredChats = chats
    .filter(chat => {
      // 首先根据标签过滤
      let matchesTab = false;
      if (activeTab === 'all') matchesTab = true;
      else if (activeTab === 'single') matchesTab = !chat.isGroup;
      else if (activeTab === 'group') matchesTab = chat.isGroup;
      
      if (!matchesTab) return false;
      
      // 如果没有搜索查询，直接返回
      if (!searchQuery.trim()) return true;
      
      // 搜索逻辑：角色名字、人设、聊天记录内容
      const query = searchQuery.toLowerCase();
      
      // 搜索角色名字
      if (chat.name.toLowerCase().includes(query)) return true;
      
      // 搜索人设
      if (chat.persona && chat.persona.toLowerCase().includes(query)) return true;
      
      // 搜索聊天记录内容
      if (chat.messages && chat.messages.some(msg => 
        msg.content && msg.content.toLowerCase().includes(query)
      )) return true;
      
      // 搜索群成员名字（如果是群聊）
      if (chat.isGroup && chat.members) {
        if (chat.members.some(member => 
          member.originalName.toLowerCase().includes(query) ||
          member.groupNickname.toLowerCase().includes(query) ||
          (member.persona && member.persona.toLowerCase().includes(query))
        )) return true;
      }
      
      return false;
    })
    .sort((a, b) => {
      // 按最近聊天时间排序
      // 获取最后一条消息的时间戳
      const getLastMessageTime = (chat: ChatItem) => {
        if (chat.messages && chat.messages.length > 0) {
          const lastMessage = chat.messages[chat.messages.length - 1];
          return lastMessage.timestamp ? new Date(lastMessage.timestamp).getTime() : 0;
        }
        // 如果没有消息，使用创建时间（从ID推断）
        return parseInt(chat.id) || 0;
      };
      
      const timeA = getLastMessageTime(a);
      const timeB = getLastMessageTime(b);
      
      // 降序排列（最新的在前面）
      return timeB - timeA;
    });

  // 获取当前选中的聊天
  const selectedChat = selectedChatId ? chats.find(chat => chat.id === selectedChatId) : null;

  // 获取可用的联系人列表（用于创建群聊）
  const availableContacts = chats.filter(chat => !chat.isGroup);
  
  // 获取所有聊天列表（用于记忆管理）
  const allChats = chats;

  if (isLoading) {
    return (
      <div className="chat-list-page loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  // 定义页面配置
  const pages = [
    {
      id: 'list',
      component: (
        <div className="chat-list-page">
          {/* 顶部导航栏 */}
          <ChatListHeader 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onOpenAddFriend={handleOpenAddFriend}
            onOpenCreateGroup={() => setShowCreateGroup(true)}
            onOpenWorldBook={handleOpenWorldBook}
            onBackToDesktop={onBackToDesktop}
            onOpenMePage={() => handleViewChange('me')}
            onOpenCharacterImport={handleOpenCharacterImport}
            personalSettings={personalSettings}
                    />
          
          {/* 搜索框 */}
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* 聊天列表 */}
          <ChatList 
            chats={filteredChats} 
            onChatClick={handleOpenChat}
            onDeleteChat={handleDeleteChat}
            onEditChat={handleEditChat}
            onAssociateWorldBook={handleAssociateWorldBook}
          />
        </div>
      ),
      direction: 'right' as const,
      duration: 300
    },
    {
      id: 'chat',
      component: selectedChat ? (
        <ChatInterface
          chat={selectedChat}
          apiConfig={apiConfig}
          onBack={() => setCurrentScreen('list')}
          onUpdateChat={handleUpdateChat}
          availableContacts={availableContacts}
          allChats={allChats}
          personalSettings={personalSettings}
          currentPreset={currentPreset || undefined}
        />
      ) : <div>聊天加载中...</div>,
      direction: 'left' as const,
      duration: 300
    },

    {
      id: 'worldbook',
      component: (
        <WorldBookListPage onBack={() => setCurrentScreen('list')} />
      ),
      direction: 'left' as const,
      duration: 300
    }
  ];

  return (
    <>
      <PageTransitionManager
        pages={pages}
        currentPageId={currentScreen}
        defaultDirection="left"
        defaultDuration={300}
      />
      
      {/* 底部导航 - 只在消息列表显示 */}
      {currentScreen === 'list' && (
        <BottomNavigation
          activeView={activeView}
          onViewChange={handleViewChange}
          newContentCount={newContentCount}
          forceShow={true}
        />
      )}
      
      {/* API设置模态框 */}
      <ApiSettingsModal
        isVisible={showApiSettings}
        onClose={() => setShowApiSettings(false)}
        onSave={handleSaveApiConfig}
        currentConfig={apiConfig}
      />
      
      {/* 个人设置模态框 */}
      <PersonalSettingsModal
        isVisible={showPersonalSettings}
        onClose={() => setShowPersonalSettings(false)}
        onSave={handleSavePersonalSettings}
        currentSettings={personalSettings}
      />
      
      {/* 统一的好友模态框（创建/编辑） */}
      <EditFriendModal
        isVisible={showFriendModal}
        mode={friendModalMode}
        onClose={handleCloseFriendModal}
        onAddFriend={handleAddFriend}
        onUpdateFriend={handleUpdateFriend}
        chat={editingChat}
      />
      
      {/* 创建/编辑群聊模态框 */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => {
          setShowCreateGroup(false);
          setEditingChat(null);
        }}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateChat}
        availableContacts={availableContacts}
        editingGroup={editingChat}
        apiConfig={apiConfig}
      />

      {/* 世界书关联弹窗 */}
      {associatingChatId && (
        <WorldBookAssociationModal
          isVisible={showWorldBookAssociation}
          chatName={chats.find(c => c.id === associatingChatId)?.name || ''}
          currentLinkedIds={chats.find(c => c.id === associatingChatId)?.settings.linkedWorldBookIds || []}
          onClose={handleCloseWorldBookAssociation}
          onSave={handleSaveWorldBookAssociation}
        />
      )}

      {/* 角色导入模态框 */}
      <CharacterImportModal
        isVisible={showCharacterImport}
        onClose={() => setShowCharacterImport(false)}
        onImportCharacter={handleImportCharacter}
        apiConfig={apiConfig}
        personalSettings={personalSettings}
      />
    </>
  );
}