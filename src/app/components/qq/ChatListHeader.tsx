'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '../../components/i18n/I18nProvider';
import Image from 'next/image';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface ChatListHeaderProps {
  activeTab: 'all' | 'single' | 'group';
  onTabChange: (tab: 'all' | 'single' | 'group') => void;
  onOpenAddFriend: () => void;
  onOpenCreateGroup: () => void;
  onOpenWorldBook: () => void;
  onOpenCharacterImport?: () => void;
  onBackToDesktop?: () => void;
  onOpenMePage?: () => void;
  personalSettings?: PersonalSettings;
  maxMemory: number;
  onMaxMemoryChange: (value: number) => void;
  showContextSettings: boolean;
  onToggleContextSettings: () => void;
}

export default function ChatListHeader({ activeTab, onTabChange, onOpenAddFriend, onOpenCreateGroup, onOpenWorldBook, onOpenCharacterImport, onBackToDesktop, onOpenMePage, personalSettings, maxMemory, onMaxMemoryChange, showContextSettings, onToggleContextSettings }: ChatListHeaderProps) {
  const { t } = useI18n();
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // 添加点击空白区域关闭菜单的功能
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // 关闭添加下拉菜单
      if (showAddDropdown && !target.closest('.add-menu-container')) {
        setShowAddDropdown(false);
      }
      
      // 关闭上下文设置面板
      if (showContextSettings && !target.closest('.context-settings-container')) {
        onToggleContextSettings();
      }
    };

    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    
    // 清理事件监听器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddDropdown, showContextSettings, onToggleContextSettings]);

  return (
    <div className="chat-list-header">
      {/* 左侧区域：返回按钮 + 用户头像 + 用户名 */}
      <div className="header-left">
        {/* 返回按钮 */}
        {onBackToDesktop && (
          <div className="back-button" onClick={onBackToDesktop}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* 用户头像和用户名 */}
        <div className="user-avatar-section">
          <div className="user-avatar-container">
            <Image 
              src={personalSettings?.userAvatar || '/avatars/user-avatar.svg'} 
              alt={t('QQ.Header.userAvatar', '用户头像')} 
              width={48}
              height={48}
              className="user-avatar"
              onClick={onOpenMePage}
              unoptimized={personalSettings?.userAvatar?.startsWith('data:')}
            />
          </div>
          <div className="user-name" onClick={onOpenMePage}>
            {personalSettings?.userNickname || t('QQ.Header.user', '用户')}
          </div>
        </div>
      </div>

      {/* 群聊/单聊切换开关 */}
      <div className="chat-type-toggle">
        <button 
          className={`toggle-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => onTabChange('all')}
        >
          {t('QQ.Header.tab.all', '全部')}
        </button>
        <button 
          className={`toggle-btn ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => onTabChange('single')}
        >
          {t('QQ.Header.tab.single', '单聊')}
        </button>
        <button 
          className={`toggle-btn ${activeTab === 'group' ? 'active' : ''}`}
          onClick={() => onTabChange('group')}
        >
          {t('QQ.Header.tab.group', '群聊')}
        </button>
      </div>

      {/* 右侧操作区域 */}
      <div className="header-actions">
        {/* 上下文设置按钮 */}
        <div className="context-settings-container" style={{ position: 'relative', marginRight: '8px' }}>
          <button
            className="context-settings-btn"
            onClick={onToggleContextSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '20px',
              fontSize: '11px',
              color: '#6c757d',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e9ecef';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
            }}
            title={t('QQ.Header.contextSettings.title', '设置AI上下文注入的消息数量上限')}
          >
            {t('QQ.Header.contextSettings.button', '上下文')}
          </button>
          
          {/* 设置面板 */}
          {showContextSettings && (
            <div 
              className="context-settings-panel"
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '280px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#333', fontWeight: '600' }}>
                  {t('QQ.Header.contextSettings.panelTitle', 'AI上下文设置')}
                </h4>
                <button
                  onClick={onToggleContextSettings}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    color: '#999',
                    cursor: 'pointer',
                    padding: '0',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={t('QQ.common.close', '关闭')}
                >
                  ×
                </button>
              </div>
              
                                <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="max-memory-slider" style={{ 
                      display: 'block', 
                      fontSize: '13px', 
                      color: '#555', 
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      {t('QQ.Header.contextSettings.maxMemoryLabel', '上下文注入消息上限')}
                    </label>
                    
                    {/* 滑块容器 */}
                    <div style={{ marginBottom: '12px' }}>
                      <input
                        id="max-memory-slider"
                        type="range"
                        min="1"
                        max="500"
                        value={maxMemory}
                        onChange={(e) => onMaxMemoryChange(Number(e.target.value))}
                        style={{
                          width: '100%',
                          height: '6px',
                          borderRadius: '3px',
                          background: '#e9ecef',
                          outline: 'none',
                          cursor: 'pointer',
                          WebkitAppearance: 'none',
                          appearance: 'none'
                        }}
                      />
                      
                      {/* 滑块样式 */}
                      <style jsx>{`
                        input[type="range"] {
                          position: relative;
                        }
                        
                        input[type="range"]::before {
                          content: '';
                          position: absolute;
                          top: 0;
                          left: 0;
                          height: 6px;
                          width: ${(maxMemory - 1) / 499 * 100}%;
                          background: #007bff;
                          border-radius: 3px;
                          pointer-events: none;
                          z-index: 1;
                        }
                        
                        input[type="range"]::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #007bff;
                          cursor: pointer;
                          border: 2px solid #fff;
                          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                          transition: all 0.2s ease;
                          position: relative;
                          z-index: 2;
                        }
                        
                        input[type="range"]::-webkit-slider-thumb:hover {
                          background: #0056b3;
                          transform: scale(1.1);
                        }
                        
                        input[type="range"]::-moz-range-thumb {
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #007bff;
                          cursor: pointer;
                          border: 2px solid #fff;
                          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                          transition: all 0.2s ease;
                          position: relative;
                          z-index: 2;
                        }
                        
                        input[type="range"]::-moz-range-thumb:hover {
                          background: #0056b3;
                          transform: scale(1.1);
                        }
                      `}</style>
                    </div>
                    
                    {/* 数值显示和快速设置按钮 */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#007bff',
                        minWidth: '60px',
                        textAlign: 'center'
                      }}>
                        {maxMemory}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[20, 50, 100, 200, 500].map(value => (
                          <button
                            key={value}
                            onClick={() => onMaxMemoryChange(value)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              border: `1px solid ${maxMemory === value ? '#007bff' : '#ddd'}`,
                              borderRadius: '12px',
                              backgroundColor: maxMemory === value ? '#007bff' : '#f8f9fa',
                              color: maxMemory === value ? '#fff' : '#666',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (maxMemory !== value) {
                                e.currentTarget.style.backgroundColor = '#e9ecef';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (maxMemory !== value) {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                              }
                            }}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <small style={{ 
                      display: 'block', 
                      fontSize: '11px', 
                      color: '#888', 
                      marginTop: '6px',
                      lineHeight: '1.4'
                    }}>
                      {t('QQ.Header.contextSettings.tip', '控制注入到AI的历史消息数量，数值越大AI记忆越完整，但响应可能变慢')}
                    </small>
                    
                    <div style={{ 
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#856404'
                    }}>
                      <strong>💡 {t('QQ.common.hint', '提示')}：</strong>{t('QQ.Header.contextSettings.limitHint', '最多可设置500条消息，超过此数量可能导致AI响应变慢或API调用失败')}
                    </div>
                  </div>
              
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {t('QQ.Header.contextSettings.current', '当前设置：')}<strong style={{ color: '#007bff' }}>{maxMemory}</strong> {t('QQ.Header.contextSettings.messages', '条消息')}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>
                  {t('QQ.Header.contextSettings.saved', '设置已保存到本地，立即生效于AI调用')}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="add-menu-container">
          <button 
            className="add-btn"
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            type="button"
            title={t('QQ.Header.add', '添加')}
          >
            +
          </button>
          
          {/* 添加菜单下拉 */}
          {showAddDropdown && (
            <div className="add-dropdown-menu visible">
              <div className="dropdown-item" onClick={() => { setShowAddDropdown(false); onOpenAddFriend(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2"/>
                  <line x1="17" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>{t('QQ.Header.addFriend', '添加好友')}</span>
              </div>
              <div className="dropdown-item" onClick={() => { setShowAddDropdown(false); onOpenCreateGroup(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 11l-2-2v4l2-2z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>{t('QQ.Header.createGroup', '创建群聊')}</span>
              </div>
              <div className="dropdown-item" onClick={() => { setShowAddDropdown(false); onOpenWorldBook(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>{t('QQ.Header.worldBook', '世界书')}</span>
              </div>
              {onOpenCharacterImport && (
                <div className="dropdown-item" onClick={() => { setShowAddDropdown(false); onOpenCharacterImport(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{t('QQ.Header.importCharacter', '导入角色卡片')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 