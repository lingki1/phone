'use client';

import { useState, useEffect } from 'react';
import ChatListHeader from './ChatListHeader';
import ChatList from './ChatList';
import BottomNavigation from './BottomNavigation';
import ApiSettingsModal from './ApiSettingsModal';
import AddFriendModal from './AddFriendModal';
import ChatInterface from './ChatInterface';
import CreateGroupModal from './CreateGroupModal';
import GroupSettings from './GroupSettings';
import GroupMessageFeatures from './GroupMessageFeatures';
import EditFriendModal from './EditFriendModal';
import { ChatItem, Message, ApiConfig } from '../types/chat';
import { dataManager } from '../utils/dataManager';
import './ChatListPage.css';

export default function ChatListPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'single' | 'group'>('all');
  const [activeView, setActiveView] = useState<'messages' | 'moments' | 'history'>('messages');
  const [currentScreen, setCurrentScreen] = useState<'list' | 'chat'>('list');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // 模态框状态
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showGroupFeatures, setShowGroupFeatures] = useState(false);
  const [showEditFriend, setShowEditFriend] = useState(false);
  const [editingChat, setEditingChat] = useState<ChatItem | null>(null);
  
  // API配置状态
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    proxyUrl: '',
    apiKey: '',
    model: ''
  });
  
  // 聊天数据状态
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化数据库和加载数据
  useEffect(() => {
    const initData = async () => {
      try {
        await dataManager.initDB();
        
        // 加载API配置
        const savedApiConfig = await dataManager.getApiConfig();
        setApiConfig(savedApiConfig);
        
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

  // 添加好友
  const handleAddFriend = async (name: string, persona: string) => {
    const newChat: ChatItem = {
      id: Date.now().toString(),
      name,
      avatar: '/avatars/default-avatar.svg',
      lastMessage: '开始聊天吧！',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isGroup: false,
      messages: [],
      persona,
      settings: {
        aiPersona: persona,
        myPersona: '用户',
        maxMemory: 20,
        aiAvatar: '/avatars/default-avatar.svg',
        myAvatar: '/avatars/user-avatar.svg',
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

  // 发送群功能消息
  const handleSendGroupMessage = (message: Message) => {
    if (!selectedChat) return;
    
    const updatedChat = {
      ...selectedChat,
      messages: [...selectedChat.messages, message],
      lastMessage: message.content,
      timestamp: new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    
    handleUpdateChat(updatedChat);
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
    if (chat && !chat.isGroup) {
      setEditingChat(chat);
      setShowEditFriend(true);
    }
  };

  // 更新好友信息
  const handleUpdateFriend = (updatedChat: ChatItem) => {
    handleUpdateChat(updatedChat);
    setShowEditFriend(false);
    setEditingChat(null);
  };

  // 根据当前选中的标签过滤聊天列表
  const filteredChats = chats.filter(chat => {
    if (activeTab === 'all') return true;
    if (activeTab === 'single') return !chat.isGroup;
    if (activeTab === 'group') return chat.isGroup;
    return true;
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
        />
        
        {/* 群设置模态框 */}
        {selectedChat.isGroup && (
          <GroupSettings
            isOpen={showGroupSettings}
            onClose={() => setShowGroupSettings(false)}
            chat={selectedChat}
            onUpdateChat={handleUpdateChat}
          />
        )}
        
        {/* 群功能模态框 */}
        {selectedChat.isGroup && (
          <GroupMessageFeatures
            isOpen={showGroupFeatures}
            onClose={() => setShowGroupFeatures(false)}
            chat={selectedChat}
            onSendMessage={handleSendGroupMessage}
          />
        )}
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
        onOpenAddFriend={() => setShowAddFriend(true)}
        onOpenCreateGroup={() => setShowCreateGroup(true)}
      />
      
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
      
      {/* 添加好友模态框 */}
      <AddFriendModal
        isVisible={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onAddFriend={handleAddFriend}
      />
      
      {/* 创建群聊模态框 */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
        availableContacts={availableContacts}
      />
      
      {/* 编辑好友模态框 */}
      <EditFriendModal
        isVisible={showEditFriend}
        onClose={() => {
          setShowEditFriend(false);
          setEditingChat(null);
        }}
        onUpdateFriend={handleUpdateFriend}
        chat={editingChat}
      />
    </div>
  );
}