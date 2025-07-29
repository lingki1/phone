'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChatItem } from '../../types/chat';
import './AddFriendModal.css';

interface EditFriendModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUpdateFriend: (updatedChat: ChatItem) => void;
  chat: ChatItem | null;
}

export default function EditFriendModal({ 
  isVisible, 
  onClose, 
  onUpdateFriend,
  chat
}: EditFriendModalProps) {
  const [friendName, setFriendName] = useState('');
  const [friendPersona, setFriendPersona] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chat && isVisible) {
      setFriendName(chat.name);
      setFriendPersona(chat.persona || '');
      setAvatarPreview(chat.avatar || '');
    }
  }, [chat, isVisible]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      
      // 验证文件大小 (限制为 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
      }

      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('读取文件失败');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
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
    
    if (!chat) return;

    const updatedChat: ChatItem = {
      ...chat,
      name: friendName.trim(),
      persona: friendPersona.trim(),
      avatar: avatarPreview || chat.avatar,
      settings: {
        ...chat.settings,
        aiPersona: friendPersona.trim(),
        aiAvatar: avatarPreview || chat.settings.aiAvatar
      }
    };
    
    onUpdateFriend(updatedChat);
    onClose();
  };

  const handleCancel = () => {
    // 重置表单
    if (chat) {
      setFriendName(chat.name);
      setFriendPersona(chat.persona || '');
      setAvatarPreview(chat.avatar || '');
    }
    onClose();
  };

  if (!isVisible || !chat) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <div className="add-friend-modal">
        <div className="modal-header">
          <h2>编辑好友</h2>
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
                <p>支持 JPG、PNG、GIF 格式，大小不超过 5MB</p>
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
            <label htmlFor="friend-persona">AI人设</label>
            <textarea
              id="friend-persona"
              value={friendPersona}
              onChange={(e) => setFriendPersona(e.target.value)}
              placeholder="描述这个AI角色的性格、背景等..."
              rows={4}
            />
          </div>

          <div className="tip-box">
            <p>💡 提示：修改后的信息将立即生效，你可以随时再次编辑。</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>取消</button>
          <button className="save-btn" onClick={handleSubmit}>保存修改</button>
        </div>
      </div>
    </div>
  );
}