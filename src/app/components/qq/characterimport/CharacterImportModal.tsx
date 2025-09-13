import React, { useState, useRef } from 'react';
import { CharacterCardParser } from './CharacterCardParser';
import CharacterPreview from './CharacterPreview';
import { CharacterParseResult, PreviewCharacter } from './types';
import { ChatItem } from '../../../types/chat';
import { presetManager } from '../../../utils/presetManager';
import { useI18n } from '../../i18n/I18nProvider';
import './CharacterImportModal.css';

interface CharacterImportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onImportCharacter: (character: ChatItem) => void;
  apiConfig: {
    proxyUrl: string;
    apiKey: string;
    model: string;
  };
  personalSettings: {
    userAvatar: string;
    userNickname: string;
    userBio: string;
  };
}

export default function CharacterImportModal({
  isVisible,
  onClose,
  onImportCharacter,
  apiConfig,
  personalSettings
}: CharacterImportModalProps) {
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'loading'>('upload');
  const [parseResult, setParseResult] = useState<CharacterParseResult | null>(null);
  const [previewCharacter, setPreviewCharacter] = useState<PreviewCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setCurrentStep('loading');

    try {
      // 解析角色卡片
      const result = await CharacterCardParser.parseCharacterCard(file);
      
      if (!result.success) {
        setError(result.error || t('QQ.ChatInterface.CharacterImport.CharacterImportModal.errors.parseFailed', '解析失败'));
        setCurrentStep('upload');
        return;
      }

      if (!result.character) {
        setError(t('QQ.ChatInterface.CharacterImport.CharacterImportModal.errors.noValidData', '未找到有效的角色数据'));
        setCurrentStep('upload');
        return;
      }

      // 验证角色数据
      const validationErrors = CharacterCardParser.validateCharacter(result.character);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        setCurrentStep('upload');
        return;
      }

      // 创建预览角色
      const preview: PreviewCharacter = {
        name: result.character.name,
        avatar: result.imageData || '/avatars/default-avatar.svg',
        persona: result.character.personality,
        description: result.character.description,
        originalData: result.character
      };

      setParseResult(result);
      setPreviewCharacter(preview);
      setCurrentStep('preview');
    } catch (error) {
      console.error('处理文件失败:', error);
      setError(error instanceof Error ? error.message : t('QQ.ChatInterface.CharacterImport.CharacterImportModal.errors.processFailed', '处理文件失败'));
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理文件拖拽
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // 直接处理文件，避免类型转换问题
      handleFileSelect({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // 处理导入确认
  const handleImportConfirm = async () => {
    if (!previewCharacter || !parseResult?.character) return;

    try {
      // 获取全局设置中的maxMemory
      const globalSettings = localStorage.getItem('globalSettings');
      const maxMemory = globalSettings ? JSON.parse(globalSettings).maxMemory || 20 : 20;
      
      // 获取当前预设（用于未来扩展）
      await presetManager.getCurrentPreset();

      // 调试：检查API配置
      console.log('CharacterImportModal - 导入角色时使用的API配置:', {
        proxyUrl: apiConfig.proxyUrl,
        apiKey: apiConfig.apiKey ? '已设置' : '未设置',
        model: apiConfig.model
      });

      // 合并角色描述和人设到人设中
      const combinedPersona = [
        previewCharacter.persona,
        previewCharacter.description
      ].filter(Boolean).join('\n\n');

      // 从原始角色数据中提取开场白，并替换 {{user}} 为用户昵称
      const rawFirstMsg = previewCharacter.originalData.first_mes?.trim();
      const firstMsg = rawFirstMsg ? rawFirstMsg.replace(/\{\{user\}\}/g, personalSettings.userNickname || '我') : undefined;

      // 创建新的聊天项目
      const newChat: ChatItem = {
        id: Date.now().toString(),
        name: previewCharacter.name,
        avatar: previewCharacter.avatar,
        lastMessage: t('QQ.ChatInterface.CharacterImport.CharacterImportModal.defaultMessage', '开始聊天吧！'),
        timestamp: new Date().toLocaleTimeString(locale || 'zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isGroup: false,
        unreadCount: 0,
        lastReadTimestamp: Date.now(),
        messages: [],
        persona: combinedPersona,
        settings: {
          aiPersona: combinedPersona,
          myPersona: personalSettings.userBio || t('QQ.ChatInterface.CharacterImport.CharacterImportModal.defaultUser', '用户'),
          myNickname: personalSettings.userNickname,
          maxMemory: maxMemory,
          aiAvatar: previewCharacter.avatar,
          myAvatar: personalSettings.userAvatar,
          background: 'default',
          theme: 'light',
          fontSize: 14,
          customCss: '',
          linkedWorldBookIds: [],
          aiAvatarLibrary: [],
          aiAvatarFrame: '',
          myAvatarFrame: '',
          firstMsg: firstMsg,
          // 使用当前API配置
          proxyUrl: apiConfig.proxyUrl,
          apiKey: apiConfig.apiKey,
          model: apiConfig.model
        }
      };

      // 调用导入回调
      onImportCharacter(newChat);
      
      // 重置状态并关闭模态框
      handleClose();
    } catch (error) {
      console.error('导入角色失败:', error);
      setError(t('QQ.ChatInterface.CharacterImport.CharacterImportModal.errors.importFailed', '导入角色失败'));
    }
  };

  // 处理取消
  const handleCancel = () => {
    if (currentStep === 'preview') {
      setCurrentStep('upload');
      setParseResult(null);
      setPreviewCharacter(null);
    } else {
      handleClose();
    }
  };

  // 处理关闭
  const handleClose = () => {
    setCurrentStep('upload');
    setParseResult(null);
    setPreviewCharacter(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  // 处理点击上传区域
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!isVisible) return null;

  return (
    <div className="character-import-modal-overlay" onClick={handleClose}>
      <div className="character-import-modal" onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="modal-header">
          <h2>{t('QQ.ChatInterface.CharacterImport.CharacterImportModal.title', '导入角色卡片')}</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {/* 模态框内容 */}
        <div className="modal-body">
          {currentStep === 'upload' && (
            <div className="upload-step">
              <div className="upload-area" 
                   onClick={handleUploadClick}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}>
                <div className="upload-icon">📁</div>
                <h3>{t('QQ.ChatInterface.CharacterImport.CharacterImportModal.upload.title', '选择 SillyTavern 角色卡片')}</h3>
                <p>{t('QQ.ChatInterface.CharacterImport.CharacterImportModal.upload.supportedFormat', '支持 PNG 格式的角色卡片文件')}</p>
                <p className="upload-tip">{t('QQ.ChatInterface.CharacterImport.CharacterImportModal.upload.tip', '点击选择文件或拖拽到此处')}</p>
                <p className="upload-note">{t('QQ.ChatInterface.CharacterImport.CharacterImportModal.upload.note', '头像会自动压缩优化')}</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {error && (
                <div className="error-message">
                  <span>❌ {error}</span>
                </div>
              )}
            </div>
          )}

          {currentStep === 'loading' && (
            <div className="loading-step">
              <div className="loading-spinner"></div>
              <p>{t('QQ.ChatInterface.CharacterImport.CharacterImportModal.loading.parsing', '正在解析角色卡片并优化头像...')}</p>
              <p className="loading-subtitle">{t('QQ.ChatInterface.CharacterImport.CharacterImportModal.loading.subtitle', '这可能需要几秒钟时间')}</p>
            </div>
          )}

          {currentStep === 'preview' && previewCharacter && (
            <CharacterPreview
              character={previewCharacter}
              onImport={handleImportConfirm}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
} 