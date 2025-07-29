'use client';

import { useState, useEffect } from 'react';
import ChatListHeader from './ChatListHeader';
import ChatList from './ChatList';
import BottomNavigation from './BottomNavigation';
import ApiSettingsModal from './ApiSettingsModal';
import ChatInterface from './ChatInterface';
import CreateGroupModal from './CreateGroupModal';

import EditFriendModal from './EditFriendModal';
import PersonalSettingsModal from './PersonalSettingsModal';
import { ChatItem, ApiConfig } from '../../types/chat';
import { dataManager } from '../../utils/dataManager';
import './ChatListPage.css';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface ChatListPageProps {
  onBackToDesktop?: () => void;
}

export default function ChatListPage({ onBackToDesktop }: ChatListPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'single' | 'group'>('all');
  const [activeView, setActiveView] = useState<'messages' | 'moments' | 'me'>('messages');
  const [currentScreen, setCurrentScreen] = useState<'list' | 'chat'>('list');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // 模态框状态
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showPersonalSettings, setShowPersonalSettings] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friendModalMode, setFriendModalMode] = useState<'create' | 'edit'>('create');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingChat, setEditingChat] = useState<ChatItem | null>(null);
  
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
  
  // 聊天数据状态
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');

  // 初始化数据库和加载数据
  useEffect(() => {
    const initData = async () => {
      try {
        await dataManager.initDB();
        
        // 加载API配置
        const savedApiConfig = await dataManager.getApiConfig();
        setApiConfig(savedApiConfig);
        
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
    setApiConfig(config);
    try {
      await dataManager.saveApiConfig(config);
    } catch (error) {
      console.error('Failed to save API config:', error);
      localStorage.setItem('apiConfig', JSON.stringify(config));
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
        maxMemory: 20,
        aiAvatar: avatar || '/avatars/default-avatar.svg',
        myAvatar: personalSettings.userAvatar,
        background: 'default',
        theme: 'light',
        fontSize: 14,
        customCss: '',
        linkedWorldBookIds: [],
        aiAvatarLibrary: [],
        aiAvatarFrame: '',
        myAvatarFrame: ''
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

  // 关闭好友模态框
  const handleCloseFriendModal = () => {
    setShowFriendModal(false);
    setEditingChat(null);
  };

  // 根据当前选中的标签和搜索查询过滤聊天列表
  const filteredChats = chats.filter(chat => {
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
  });

  // 获取当前选中的聊天
  const selectedChat = selectedChatId ? chats.find(chat => chat.id === selectedChatId) : null;

  // 获取可用的联系人列表（用于创建群聊）
  const availableContacts = chats.filter(chat => !chat.isGroup);

  if (isLoading) {
    return (
      <div className="chat-list-page loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (currentScreen === 'chat' && selectedChat) {
    return (
      <>
        <ChatInterface
          chat={selectedChat}
          apiConfig={apiConfig}
          onBack={() => setCurrentScreen('list')}
          onUpdateChat={handleUpdateChat}
          availableContacts={availableContacts}
          personalSettings={personalSettings}
        />
      </>
    );
  }

  return (
    <div className="chat-list-page">
      {/* 顶部导航栏 */}
      <ChatListHeader 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenApiSettings={() => setShowApiSettings(true)}
        onOpenPersonalSettings={() => setShowPersonalSettings(true)}
        onOpenAddFriend={handleOpenAddFriend}
        onOpenCreateGroup={() => setShowCreateGroup(true)}
        onBackToDesktop={onBackToDesktop}
        personalSettings={personalSettings}
      />
      
      {/* 搜索框 */}
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="搜索角色、人设、聊天内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="m15 9-6 6"/>
                <path d="m9 9 6 6"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* 聊天列表 */}
      <ChatList 
        chats={filteredChats} 
        onChatClick={handleOpenChat}
        onDeleteChat={handleDeleteChat}
        onEditChat={handleEditChat}
      />
      
      {/* 底部导航栏 */}
      <BottomNavigation 
        activeView={activeView}
        onViewChange={setActiveView}
      />
      
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
      />
    </div>
  );
}