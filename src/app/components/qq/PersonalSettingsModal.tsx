'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { dataManager } from '../../utils/dataManager';
import { compressImage } from '../../utils/imageCompressor';
import './PersonalSettingsModal.css';
import TrimUploadPhotoModal from '../trimuploadphoto/TrimUploadPhotoModal';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface PersonalSettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (settings: PersonalSettings) => void;
  currentSettings: PersonalSettings;
}

export default function PersonalSettingsModal({ 
  isVisible, 
  onClose, 
  onSave, 
  currentSettings 
}: PersonalSettingsModalProps) {
  const [settings, setSettings] = useState<PersonalSettings>(currentSettings);
  const [avatarPreview, setAvatarPreview] = useState(currentSettings.userAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string>('');

  useEffect(() => {
    if (isVisible) {
      setSettings(currentSettings);
      setAvatarPreview(currentSettings.userAvatar);
    }
  }, [isVisible, currentSettings]);

  const handleInputChange = (field: keyof PersonalSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
      // 进入裁剪流程
      const objectUrl = URL.createObjectURL(file);
      setRawImageUrl(objectUrl);
      setCropModalVisible(true);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!settings.userNickname.trim()) {
      alert('请输入用户昵称');
      return;
    }
    
    try {
      // 保存到数据库
      await dataManager.initDB();
      await dataManager.savePersonalSettings(settings);
      console.log('个人设置已保存到数据库:', settings);
    } catch (error) {
      console.error('Failed to save personal settings to database:', error);
      // 如果数据库保存失败，回退到localStorage
      localStorage.setItem('personalSettings', JSON.stringify(settings));
    }
    
    onSave(settings);
    onClose();
  };

  const handleCancel = () => {
    // 重置表单
    setSettings(currentSettings);
    setAvatarPreview(currentSettings.userAvatar);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <div className="personal-settings-modal">
        <div className="modal-header">
          <h2>个人设置</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <div className="modal-body">
          {/* 头像上传区域 */}
          <div className="form-group">
            <label>用户头像</label>
            <div className="avatar-upload-container">
              <div 
                className={`avatar-preview ${isUploading ? 'uploading' : ''}`}
                onClick={handleAvatarClick}
              >
                {avatarPreview ? (
                  <Image 
                    src={avatarPreview} 
                    alt="用户头像" 
                    width={100}
                    height={100}
                    className="avatar-image"
                    unoptimized
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <span>👤</span>
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
            <label htmlFor="user-nickname">用户昵称</label>
            <input
              type="text"
              id="user-nickname"
              value={settings.userNickname}
              onChange={(e) => handleInputChange('userNickname', e.target.value)}
              placeholder="请输入你的昵称"
              maxLength={20}
            />
            <div className="char-count">{settings.userNickname.length}/20</div>
          </div>

          <div className="form-group">
            <label htmlFor="user-bio">个人介绍</label>
            <textarea
              id="user-bio"
              value={settings.userBio}
              onChange={(e) => handleInputChange('userBio', e.target.value)}
              placeholder="介绍一下你自己吧..."
              rows={4}
              maxLength={10000}
            />
            <div className="char-count">{settings.userBio.length}/10000</div>
          </div>

          <div className="tip-box">
            <p>💡 提示：用户昵称和个人介绍会在聊天时注入到系统提示词中，帮助AI更好地了解你。</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>取消</button>
          <button className="save-btn" onClick={handleSave}>保存设置</button>
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
              setSettings(prev => ({ ...prev, userAvatar: compressed }));
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