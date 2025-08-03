import React, { useState, useRef } from 'react';
import { CharacterCardParser } from './CharacterCardParser';
import CharacterPreview from './CharacterPreview';
import { CharacterParseResult, PreviewCharacter } from './types';
import { ChatItem } from '../../../types/chat';
import { presetManager } from '../../../utils/presetManager';
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
        setError(result.error || '解析失败');
        setCurrentStep('upload');
        return;
      }

      if (!result.character) {
        setError('未找到有效的角色数据');
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
      setError(error instanceof Error ? error.message : '处理文件失败');
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

      // 创建新的聊天项目
      const newChat: ChatItem = {
        id: Date.now().toString(),
        name: previewCharacter.name,
        avatar: previewCharacter.avatar,
        lastMessage: '开始聊天吧！',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isGroup: false,
        messages: [],
        persona: combinedPersona,
        settings: {
          aiPersona: combinedPersona,
          myPersona: personalSettings.userBio || '用户',
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
      setError('导入角色失败');
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
          <h2>导入角色卡片</h2>
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
                <h3>选择 SillyTavern 角色卡片</h3>
                <p>支持 PNG 格式的角色卡片文件</p>
                <p className="upload-tip">点击选择文件或拖拽到此处</p>
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
              <p>正在解析角色卡片...</p>
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