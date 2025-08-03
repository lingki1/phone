'use client';

import React, { useState, useRef } from 'react';
import { CharacterCardParser } from './CharacterCardParser';
import CharacterPreview from './CharacterPreview';
import { PNGParseResult, CharacterImportState } from './types';
import { ChatItem } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './CharacterImportModal.css';

interface CharacterImportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onImportSuccess: (chat: ChatItem) => void;
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
  onImportSuccess,
  apiConfig,
  personalSettings
}: CharacterImportModalProps) {
  const [importState, setImportState] = useState<CharacterImportState>({
    isImporting: false,
    progress: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportState({
      isImporting: true,
      progress: 10
    });

    try {
      // 解析 PNG 文件
      const result: PNGParseResult = await CharacterCardParser.parsePNGFile(file);
      
      setImportState(prev => ({
        ...prev,
        progress: 50
      }));

      if (!result.success) {
        setImportState({
          isImporting: false,
          progress: 0,
          error: result.error
        });
        return;
      }

      if (!result.character || !result.imageData) {
        setImportState({
          isImporting: false,
          progress: 0,
          error: '无法解析角色数据'
        });
        return;
      }

      // 验证角色数据
      const validation = CharacterCardParser.validateCharacter(result.character);
      if (!validation.isValid) {
        setImportState({
          isImporting: false,
          progress: 0,
          error: `角色数据验证失败: ${validation.errors.join(', ')}`
        });
        return;
      }

      // 显示预览
      setImportState({
        isImporting: false,
        progress: 100,
        preview: {
          character: result.character,
          imageData: result.imageData
        }
      });

    } catch (error) {
      console.error('文件处理失败:', error);
      setImportState({
        isImporting: false,
        progress: 0,
        error: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
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
      // 直接处理文件，不模拟事件
      handleFileSelect({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // 处理文件上传点击
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!importState.preview) return;

    setImportState(prev => ({
      ...prev,
      isImporting: true
    }));

    try {
      const { character, imageData } = importState.preview;
      
      // 获取全局设置中的maxMemory
      const globalSettings = localStorage.getItem('globalSettings');
      const maxMemory = globalSettings ? JSON.parse(globalSettings).maxMemory || 20 : 20;

      // 创建新的聊天项目
      const newChat: ChatItem = {
        id: Date.now().toString(),
        name: character.name,
        avatar: imageData, // 使用解析出的图片作为头像
        lastMessage: character.first_mes || '开始聊天吧！',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isGroup: false,
        messages: [],
        persona: character.personality,
        settings: {
          aiPersona: character.personality,
          myPersona: personalSettings.userBio || '用户',
          myNickname: personalSettings.userNickname,
          maxMemory: maxMemory,
          aiAvatar: imageData,
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

      // 保存到数据库
      await dataManager.saveChat(newChat);

      // 通知父组件
      onImportSuccess(newChat);

      // 关闭模态框
      onClose();

    } catch (error) {
      console.error('导入失败:', error);
      setImportState(prev => ({
        ...prev,
        isImporting: false,
        error: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      }));
    }
  };

  // 取消导入
  const handleCancelImport = () => {
    setImportState({
      isImporting: false,
      progress: 0
    });
  };

  // 关闭模态框
  const handleClose = () => {
    if (importState.isImporting) return; // 导入中不允许关闭
    setImportState({
      isImporting: false,
      progress: 0
    });
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="character-import-modal-overlay" onClick={handleClose}>
      <div className="character-import-modal" onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="modal-header">
          <h2>导入角色卡片</h2>
          <button className="close-btn" onClick={handleClose} disabled={importState.isImporting}>
            ×
          </button>
        </div>

        {/* 模态框内容 */}
        <div className="modal-content">
          {importState.error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {importState.error}
            </div>
          )}

          {importState.preview ? (
            // 显示角色预览
            <CharacterPreview
              character={importState.preview.character}
              imageData={importState.preview.imageData}
              onConfirm={handleConfirmImport}
              onCancel={handleCancelImport}
              isImporting={importState.isImporting}
            />
          ) : (
            // 显示文件上传界面
            <div className="upload-section">
              <div
                className="upload-area"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
              >
                {importState.isImporting ? (
                  <div className="upload-loading">
                    <div className="loading-spinner"></div>
                    <p>正在解析角色卡片...</p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${importState.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📄</div>
                    <h3>选择 SillyTavern 角色卡片</h3>
                    <p>拖拽 PNG 文件到此处，或点击选择文件</p>
                    <div className="upload-tips">
                      <p>支持格式：PNG 角色卡片</p>
                      <p>文件大小：最大 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 