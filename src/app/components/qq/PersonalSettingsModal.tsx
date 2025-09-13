'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { dataManager } from '../../utils/dataManager';
import { compressImage } from '../../utils/imageCompressor';
import { useI18n } from '../i18n/I18nProvider';
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
  const { t } = useI18n();
  const [settings, setSettings] = useState<PersonalSettings>(currentSettings);
  const [avatarPreview, setAvatarPreview] = useState(currentSettings.userAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string>('');
  const [personaList, setPersonaList] = useState<Array<{ id: string; userAvatar: string; userNickname: string; userBio: string; isActive?: boolean }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setSettings(currentSettings);
      setAvatarPreview(currentSettings.userAvatar);
      // 加载人设列表
      (async () => {
        try {
          await dataManager.initDB();
          const all = await dataManager.getAllPersonalSettingsFromCollection();
          setPersonaList(all);
          const active = all.find(p => p.isActive);
          setSelectedPersonaId(active ? active.id : null);
        } catch (e) {
          console.warn(t('QQ.ChatInterface.Me.PersonalSettingsModal.logs.loadPersonaListFailed', '加载人设列表失败:'), e);
        }
      })();
    }
  }, [isVisible, currentSettings, t]);

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
        alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.pleaseSelectImage', '请选择图片文件'));
        return;
      }
      
      // 验证文件大小 (限制为 10MB，压缩后会变小)
      if (file.size > 10 * 1024 * 1024) {
        alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.imageSizeExceeded', '图片大小不能超过 10MB'));
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
    try {
      await dataManager.initDB();
      // 校验：必须有已保存的人设且被选择
      if (!personaList || personaList.length === 0) {
        alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.pleaseSaveToList', '请先保存到列表'));
        return;
      }
      if (!selectedPersonaId) {
        alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.pleaseSelectPersona', '请先从列表中选择一个人设'));
        return;
      }
      const picked = personaList.find(p => p.id === selectedPersonaId);
      if (!picked) {
        alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.personaNotFound', '所选人设不存在，请重试'));
        return;
      }
      // 更新集合中“当前”状态
      await dataManager.setActivePersonalSettings(selectedPersonaId);
      const refreshed = await dataManager.getAllPersonalSettingsFromCollection();
      setPersonaList(refreshed);
      // 仅确认使用被选择的人设，不执行保存到数据库
      const newSettings = {
        userAvatar: picked.userAvatar,
        userNickname: picked.userNickname,
        userBio: picked.userBio
      };
      onSave(newSettings);
      onClose();
    } catch (error) {
      console.error(t('QQ.ChatInterface.Me.PersonalSettingsModal.logs.saveConfigFailed', '保存配置失败:'), error);
      alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.saveConfigFailed', '保存配置失败，请重试'));
    }
  };

  const handleSaveToList = async () => {
    if (!settings.userNickname.trim()) {
      alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.pleaseEnterNickname', '请输入用户昵称'));
      return;
    }
    try {
      await dataManager.initDB();
      if (editingId) {
        await dataManager.updatePersonalSettingsInCollection(editingId, {
          userAvatar: settings.userAvatar,
          userNickname: settings.userNickname,
          userBio: settings.userBio,
          setActive: true
        });
        setEditingId(null);
      } else {
        await dataManager.addPersonalSettingsToCollection({
          userAvatar: settings.userAvatar,
          userNickname: settings.userNickname,
          userBio: settings.userBio,
          setActive: true
        });
      }
      const all = await dataManager.getAllPersonalSettingsFromCollection();
      setPersonaList(all);
      // 同步到当前设置（不触发父级 onSave，避免关闭窗口）
      await dataManager.savePersonalSettings(settings);
      // 清空用户填写信息为默认值（不关闭窗口）
      const defaultSettings: PersonalSettings = {
        userAvatar: '/avatars/user-avatar.svg',
        userNickname: '',
        userBio: ''
      };
      setSettings(defaultSettings);
      setAvatarPreview(defaultSettings.userAvatar);
      alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.success.savedToList', '已保存到列表，并设为当前'));
    } catch (e) {
      console.error(t('QQ.ChatInterface.Me.PersonalSettingsModal.logs.saveToListFailed', '保存到列表失败:'), e);
      alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.saveToListFailed', '保存到列表失败，请重试'));
    }
  };

  const handleSelectActive = async (id: string) => {
    try {
      await dataManager.initDB();
      await dataManager.setActivePersonalSettings(id);
      const all = await dataManager.getAllPersonalSettingsFromCollection();
      setPersonaList(all);
      // 找到该条并设为当前
      const picked = all.find(p => p.id === id);
      if (picked) {
        const newSettings = {
          userAvatar: picked.userAvatar,
          userNickname: picked.userNickname,
          userBio: picked.userBio
        };
        setSettings(newSettings);
        setAvatarPreview(picked.userAvatar);
        await dataManager.savePersonalSettings(newSettings);
        onSave(newSettings);
      }
    } catch (e) {
      console.error(t('QQ.ChatInterface.Me.PersonalSettingsModal.logs.setActiveFailed', '设为当前失败:'), e);
      alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.setActiveFailed', '设为当前失败，请重试'));
    }
  };

  const handleDeletePersona = async (id: string) => {
    if (!confirm(t('QQ.ChatInterface.Me.PersonalSettingsModal.confirm.deletePersona', '确认删除这条人设吗？'))) return;
    try {
      await dataManager.initDB();
      await dataManager.deletePersonalSettingsFromCollection(id);
      const all = await dataManager.getAllPersonalSettingsFromCollection();
      setPersonaList(all);
    } catch (e) {
      console.error(t('QQ.ChatInterface.Me.PersonalSettingsModal.logs.deleteFailed', '删除失败:'), e);
      alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.deleteFailed', '删除失败，请重试'));
    }
  };

  const handleEditPersona = (id: string) => {
    const item = personaList.find(p => p.id === id);
    if (!item) return;
    setEditingId(id);
    setSettings({
      userAvatar: item.userAvatar,
      userNickname: item.userNickname,
      userBio: item.userBio
    });
    setAvatarPreview(item.userAvatar);
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
          <h2>{t('QQ.ChatInterface.Me.PersonalSettingsModal.title', '个人设置')}</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <div className="modal-body">
          {/* 头像上传区域 */}
          <div className="form-group">
            <label>{t('QQ.ChatInterface.Me.PersonalSettingsModal.avatar.label', '用户头像')}</label>
            <div className="avatar-upload-container">
              <div 
                className={`avatar-preview ${isUploading ? 'uploading' : ''}`}
                onClick={handleAvatarClick}
              >
                {avatarPreview ? (
                  <Image 
                    src={avatarPreview} 
                    alt={t('QQ.ChatInterface.Me.PersonalSettingsModal.avatar.alt', '用户头像')} 
                    width={100}
                    height={100}
                    className="avatar-image"
                    unoptimized
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <span>👤</span>
                    <span>{t('QQ.ChatInterface.Me.PersonalSettingsModal.avatar.clickToUpload', '点击上传头像')}</span>
                  </div>
                )}
                {isUploading && (
                  <div className="upload-overlay">
                    <div className="upload-spinner"></div>
                    <span>{t('QQ.ChatInterface.Me.PersonalSettingsModal.avatar.uploading', '上传中...')}</span>
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
                <p>{t('QQ.ChatInterface.Me.PersonalSettingsModal.avatar.tips', '支持 JPG、PNG、GIF 格式，大小不超过 10MB，会自动压缩优化')}</p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="user-nickname">{t('QQ.ChatInterface.Me.PersonalSettingsModal.nickname.label', '用户昵称')}</label>
            <input
              type="text"
              id="user-nickname"
              value={settings.userNickname}
              onChange={(e) => handleInputChange('userNickname', e.target.value)}
              placeholder={t('QQ.ChatInterface.Me.PersonalSettingsModal.nickname.placeholder', '请输入你的昵称')}
              maxLength={20}
            />
            <div className="char-count">{settings.userNickname.length}/20</div>
          </div>

          <div className="form-group">
            <label htmlFor="user-bio">{t('QQ.ChatInterface.Me.PersonalSettingsModal.bio.label', '个人介绍')}</label>
            <textarea
              id="user-bio"
              value={settings.userBio}
              onChange={(e) => handleInputChange('userBio', e.target.value)}
              placeholder={t('QQ.ChatInterface.Me.PersonalSettingsModal.bio.placeholder', '介绍一下你自己吧...')}
              rows={4}
              maxLength={10000}
            />
            <div className="char-count">{settings.userBio.length}/10000</div>
          </div>

          <div className="tip-box">
            <p>{t('QQ.ChatInterface.Me.PersonalSettingsModal.tip', '💡 提示：用户昵称和个人介绍会在聊天时注入到系统提示词中，帮助AI更好地了解你。')}</p>
          </div>

          {/* 保存到列表按钮（移动到已保存人设上方） */}
          <div className="mask-persona-toolbar">
            <button className="mask-persona-toolbar-btn" onClick={handleSaveToList}>
              {editingId ? t('QQ.ChatInterface.Me.PersonalSettingsModal.buttons.updateToList', '更新到列表') : t('QQ.ChatInterface.Me.PersonalSettingsModal.buttons.saveToList', '保存到列表')}
            </button>
          </div>

          {/* 人设列表 */}
          <div className="form-group">
            <label>{t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.label', '已保存的人设')}</label>
            {personaList.length === 0 ? (
              <div className="empty-list">{t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.empty', '暂无保存的人设')}</div>
            ) : (
              <div className="persona-list mask-persona-list">
                {personaList.map(item => (
                  <div key={item.id} className={`persona-item mask-persona-item ${item.isActive ? 'active' : ''} ${selectedPersonaId === item.id ? 'selected' : ''}`} onClick={() => setSelectedPersonaId(item.id)}>
                    <div className="persona-main mask-persona-main">
                      <div className="persona-avatar mask-persona-avatar" onClick={(e) => { e.stopPropagation(); handleSelectActive(item.id); }}>
                        <Image src={item.userAvatar || '/avatars/user-avatar.svg'} alt={t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.avatarAlt', '头像')} width={48} height={48} unoptimized />
                      </div>
                      <div className="persona-info mask-persona-info">
                        <div className="persona-title mask-persona-title">
                          <span className="persona-name mask-persona-name">{item.userNickname || t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.unnamed', '未命名')}</span>
                        </div>
                        <div className="persona-bio mask-persona-bio">{(item.userBio || '').slice(0, 60)}</div>
                      </div>
                    </div>
                    <div className="persona-actions mask-persona-actions">
                      <button
                        className="mask-persona-action mask-persona-action-icon mask-persona-action-primary"
                        title={t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.setActive', '设为当前')}
                        aria-label={t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.setActive', '设为当前')}
                        onClick={(e) => { e.stopPropagation(); handleSelectActive(item.id); }}
                      >
                        ✓
                      </button>
                      <button
                        className="mask-persona-action mask-persona-action-icon mask-persona-action-secondary"
                        title={t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.edit', '编辑')}
                        aria-label={t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.edit', '编辑')}
                        onClick={(e) => { e.stopPropagation(); handleEditPersona(item.id); }}
                      >
                        ✎
                      </button>
                      <button
                        className="mask-persona-action mask-persona-action-icon mask-persona-action-danger"
                        title={t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.delete', '删除')}
                        aria-label={t('QQ.ChatInterface.Me.PersonalSettingsModal.personaList.delete', '删除')}
                        onClick={(e) => { e.stopPropagation(); handleDeletePersona(item.id); }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>{t('QQ.ChatInterface.Me.PersonalSettingsModal.buttons.cancel', '取消')}</button>
          <button className="save-btn" onClick={handleSave}>{t('QQ.ChatInterface.Me.PersonalSettingsModal.buttons.save', '保存设置')}</button>
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
              alert(t('QQ.ChatInterface.Me.PersonalSettingsModal.errors.imageProcessFailed', '图片处理失败，请重试'));
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