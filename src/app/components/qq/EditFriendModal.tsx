'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChatItem } from '../../types/chat';
import { avatarManager } from '../../utils/avatarManager';
import { compressImage } from '../../utils/imageCompressor';
import TrimUploadPhotoModal from '../trimuploadphoto/TrimUploadPhotoModal';
import './AddFriendModal.css';

interface EditFriendModalProps {
  isVisible: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  onAddFriend?: (name: string, persona: string, avatar?: string, firstMsg?: string) => void;
  onUpdateFriend?: (updatedChat: ChatItem) => void;
  chat?: ChatItem | null;
}

export default function EditFriendModal({ 
  isVisible, 
  onClose, 
  mode,
  onAddFriend,
  onUpdateFriend,
  chat
}: EditFriendModalProps) {
  const [friendName, setFriendName] = useState('');
  const [friendPersona, setFriendPersona] = useState(mode === 'create' ? '请填写角色描述...' : '');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [firstMsg, setFirstMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string>('');

  useEffect(() => {
    if (mode === 'edit' && chat && isVisible) {
      setFriendName(chat.name);
      setFriendPersona(chat.persona || '');
      setAvatarPreview(chat.avatar || '');
      setFirstMsg(chat.settings.firstMsg || '');
    } else if (mode === 'create' && isVisible) {
      // 重置为创建模式
      setFriendName('');
      setFriendPersona('请填写角色描述...');
      setAvatarPreview('');
      setFirstMsg('');
    }
  }, [chat, isVisible, mode]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      
      // 验证文件大小 (限制为 10MB，压缩后会变小)
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB');
        return;
      }
      // 不直接压缩，先进入裁剪
      const objectUrl = URL.createObjectURL(file);
      setRawImageUrl(objectUrl);
      setCropModalVisible(true);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (!friendName.trim()) {
      alert('请输入好友名称');
      return;
    }
    
    if (mode === 'create' && onAddFriend) {
      onAddFriend(friendName.trim(), friendPersona.trim(), avatarPreview, firstMsg.trim() || undefined);
    } else if (mode === 'edit' && onUpdateFriend && chat) {
      const updatedChat: ChatItem = {
        ...chat,
        name: friendName.trim(),
        persona: friendPersona.trim(),
        avatar: avatarPreview || chat.avatar,
        settings: {
          ...chat.settings,
          aiPersona: friendPersona.trim(),
          aiAvatar: avatarPreview || chat.settings.aiAvatar,
          firstMsg: firstMsg.trim() || undefined
        }
      };

      // 如果头像发生了变化，需要同步更新avatarMap
      if (avatarPreview && avatarPreview !== chat.settings.aiAvatar) {
        // 确保avatarMap存在
        if (!updatedChat.avatarMap) {
          updatedChat.avatarMap = {};
        }
        
        // 更新AI角色的头像数据
        const aiAvatarId = `ai_${chat.id}`;
        updatedChat.avatarMap[aiAvatarId] = avatarPreview;
        
        // 同步到全局头像管理器（用于动态系统）
        const characterAvatarId = avatarManager.generateAvatarId('character', chat.id);
        avatarManager.updateAvatar(characterAvatarId, avatarPreview).catch(error => {
          console.warn('同步头像到全局管理器失败:', error);
        });
        
        // 如果是群聊，也要更新群成员的头像
        if (chat.isGroup && chat.members) {
          updatedChat.members = chat.members.map(member => {
            if (member.originalName === chat.name) {
              const memberAvatarId = `member_${member.originalName}`;
              updatedChat.avatarMap![memberAvatarId] = avatarPreview;
              return { ...member, avatar: avatarPreview };
            }
            return member;
          });
        }
      }

      onUpdateFriend(updatedChat);
    }
    
    onClose();
  };

  const handleCancel = () => {
    // 重置表单
    if (mode === 'edit' && chat) {
      setFriendName(chat.name);
      setFriendPersona(chat.persona || '');
      setAvatarPreview(chat.avatar || '');
    } else if (mode === 'create') {
      setFriendName('');
      setFriendPersona('请填写角色描述...');
      setAvatarPreview('');
    }
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <div className="add-friend-modal">
        <div className="modal-header">
          <h2>{mode === 'create' ? '添加好友' : '编辑好友'}</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <div className="modal-body">
          {/* 头像上传区域 */}
          <div className="form-group">
            <label>头像</label>
            <div className="avatar-upload-container">
              <div 
                className={`avatar-preview ${isUploading ? 'uploading' : ''}`}
                onClick={handleAvatarClick}
              >
                {avatarPreview ? (
                  <Image 
                    src={avatarPreview} 
                    alt="头像预览" 
                    width={100}
                    height={100}
                    className="avatar-image"
                    unoptimized
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <span>📷</span>
                    <span>点击上传头像</span>
                  </div>
                )}
                {isUploading && (
                  <div className="upload-overlay">
                    <div className="upload-spinner"></div>
                    <span>上传中...</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <div className="avatar-tips">
                <p>支持 JPG、PNG、GIF 格式，大小不超过 10MB，会自动压缩优化</p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="friend-name">好友名称</label>
            <input
              type="text"
              id="friend-name"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="请输入Ta的名字"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="friend-persona">AI人设 {mode === 'create' ? '(可选)' : ''}</label>
            <textarea
              id="friend-persona"
              value={friendPersona}
              onChange={(e) => setFriendPersona(e.target.value)}
              placeholder="描述这个AI角色的性格、背景等..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="friend-firstmsg">剧情模式开场白 {mode === 'create' ? '(可选)' : ''}</label>
            <textarea
              id="friend-firstmsg"
              value={firstMsg}
              onChange={(e) => setFirstMsg(e.target.value)}
              placeholder="例如：我们坐在咖啡馆，你走向我..."
              rows={3}
            />
          </div>

          <div className="tip-box">
            <p>💡 提示：{mode === 'create' ? '添加好友后，你可以在聊天设置中进一步自定义AI的人设、头像等信息。' : '修改后的信息将立即生效，你可以随时再次编辑。'}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>取消</button>
          <button className="save-btn" onClick={handleSubmit}>
            {mode === 'create' ? '添加好友' : '保存修改'}
          </button>
        </div>
        <TrimUploadPhotoModal
          visible={cropModalVisible}
          imageSrc={rawImageUrl}
          onCancel={() => {
            setCropModalVisible(false);
            if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
          }}
          onConfirm={async (dataUrl) => {
            try {
              setIsUploading(true);
              // 将裁剪结果数据转为 File 再复用压缩逻辑
              const res = await fetch(dataUrl);
              const blob = await res.blob();
              const fileFromDataUrl = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
              const compressed = await compressImage(fileFromDataUrl, {
                quality: 0.8,
                maxWidth: 400,
                maxHeight: 400,
                maxSize: 1 * 1024 * 1024
              });
              setAvatarPreview(compressed);
            } catch (e) {
              console.error(e);
              alert('图片处理失败，请重试');
            } finally {
              setIsUploading(false);
              setCropModalVisible(false);
              if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
              setRawImageUrl('');
            }
          }}
        />
      </div>
    </div>
  );
}