'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChatItem } from '../../types/chat';
import './CreateGroupModal.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (group: ChatItem) => void;
  availableContacts: ChatItem[];
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  availableContacts
}: CreateGroupModalProps) {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('/avatars/default-avatar.svg');
  const [myNickname, setMyNickname] = useState('');
  const [groupRules, setGroupRules] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const resetForm = () => {
    setStep(1);
    setGroupName('');
    setGroupAvatar('/avatars/default-avatar.svg');
    setMyNickname('');
    setGroupRules('');
    setSelectedContacts([]);
    setSearchTerm('');
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGroupAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedContacts.length === 0) return;

    const selectedContactObjects = availableContacts.filter(contact => 
      selectedContacts.includes(contact.id)
    );

    const newGroup: ChatItem = {
      id: Date.now().toString(),
      name: groupName,
      avatar: groupAvatar,
      lastMessage: '群聊已创建',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isGroup: true,
      messages: [],
      persona: '',
      settings: {
        aiPersona: '',
        myPersona: myNickname || '用户',
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
        myAvatarFrame: '',
        groupRules: groupRules
      },
      members: [
        {
          id: 'me',
          originalName: '用户',
          groupNickname: myNickname || '用户',
          avatar: '/avatars/user-avatar.svg',
          persona: '我是群主'
        },
        ...selectedContactObjects.map(contact => ({
          id: contact.id,
          originalName: contact.name,
          groupNickname: contact.name,
          avatar: contact.avatar,
          persona: contact.persona
        }))
      ]
    };

    onCreateGroup(newGroup);
    resetForm();
    onClose();
  };

  const handleNextStep = () => {
    if (groupName.trim()) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 过滤联系人
  const filteredContacts = availableContacts.filter(contact => 
    !contact.isGroup && 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>创建群聊</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 步骤指示器 */}
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">基本信息</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">选择成员</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">群规设置</div>
            </div>
          </div>

          {/* 第1步：基本信息 */}
          {step === 1 && (
            <div className="step-content">
              <div className="step-title">
                <h4>群聊基本信息</h4>
                <p>设置群聊的名称、头像和你的昵称</p>
              </div>

              <div className="form-group">
                <label>群聊名称 *</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="输入群聊名称（必填）"
                  maxLength={20}
                  className="form-input"
                />
                <div className="char-count">{groupName.length}/20</div>
              </div>

              <div className="form-group">
                <label>群头像</label>
                <div className="avatar-upload">
                  <div className="avatar-preview">
                    <Image 
                      src={groupAvatar} 
                      alt="群头像"
                      width={80}
                      height={80}
                    />
                    <div className="avatar-overlay">
                      <span>📷</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                    id="group-avatar-input"
                  />
                  <button 
                    type="button"
                    className="upload-btn"
                    onClick={() => document.getElementById('group-avatar-input')?.click()}
                  >
                    选择头像
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>我在群里的昵称</label>
                <input
                  type="text"
                  value={myNickname}
                  onChange={(e) => setMyNickname(e.target.value)}
                  placeholder="输入你的群昵称（可选）"
                  maxLength={15}
                  className="form-input"
                />
                <div className="char-count">{myNickname.length}/15</div>
              </div>

              <div className="step-actions">
                <button 
                  className="next-btn"
                  onClick={handleNextStep}
                  disabled={!groupName.trim()}
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 第2步：选择成员 */}
          {step === 2 && (
            <div className="step-content">
              <div className="step-title">
                <h4>选择群成员</h4>
                <p>从你的联系人中选择要加入群聊的成员</p>
              </div>

              <div className="search-box">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索联系人..."
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>

              <div className="contacts-container">
                <div className="contacts-header">
                  <span>联系人列表</span>
                  <span className="selected-count">已选择 {selectedContacts.length} 人</span>
                </div>
                
                <div className="contacts-list">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <div 
                        key={contact.id} 
                        className={`contact-item ${selectedContacts.includes(contact.id) ? 'selected' : ''}`}
                        onClick={() => handleContactToggle(contact.id)}
                      >
                        <div className="contact-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => handleContactToggle(contact.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <Image 
                          src={contact.avatar} 
                          alt={contact.name} 
                          className="contact-avatar" 
                          width={50}
                          height={50}
                        />
                        <div className="contact-info">
                          <div className="contact-name">{contact.name}</div>
                          <div className="contact-persona">
                            {contact.persona ? 
                              (contact.persona.length > 30 ? 
                                contact.persona.substring(0, 30) + '...' : 
                                contact.persona
                              ) : 
                              '暂无描述'
                            }
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-contacts">
                      <div className="no-contacts-icon">👥</div>
                      <p>暂无可添加的联系人</p>
                      <p>请先添加一些好友，然后再创建群聊</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="step-actions">
                <button 
                  className="prev-btn"
                  onClick={handlePrevStep}
                >
                  上一步
                </button>
                <button 
                  className="next-btn"
                  onClick={handleNextStep}
                  disabled={selectedContacts.length === 0}
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 第3步：群规设置 */}
          {step === 3 && (
            <div className="step-content">
              <div className="step-title">
                <h4>群规设置</h4>
                <p>设置群聊的规则和行为准则（可选）</p>
              </div>

              <div className="form-group">
                <label>群规内容</label>
                <textarea
                  value={groupRules}
                  onChange={(e) => setGroupRules(e.target.value)}
                  placeholder="输入群规内容，例如：&#10;1. 禁止发布不当内容&#10;2. 保持友善交流&#10;3. 遵守相关法律法规&#10;（可选，可以稍后设置）"
                  rows={8}
                  maxLength={500}
                  className="form-textarea"
                />
                <div className="char-count">{groupRules.length}/500</div>
              </div>

              <div className="rules-preview">
                <h5>群规预览</h5>
                <div className="rules-content">
                  {groupRules ? (
                    <div className="rules-text">{groupRules}</div>
                  ) : (
                    <div className="rules-placeholder">暂无群规</div>
                  )}
                </div>
              </div>

              <div className="step-actions">
                <button 
                  className="prev-btn"
                  onClick={handlePrevStep}
                >
                  上一步
                </button>
                <button 
                  className="create-btn"
                  onClick={handleCreateGroup}
                  disabled={selectedContacts.length === 0}
                >
                  创建群聊
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}