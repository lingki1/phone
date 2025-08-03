'use client';

import React from 'react';
import Image from 'next/image';
import { SillyTavernCharacter } from './types';
import './CharacterPreview.css';

interface CharacterPreviewProps {
  character: SillyTavernCharacter;
  imageData: string;
  onConfirm: () => void;
  onCancel: () => void;
  isImporting?: boolean;
}

export default function CharacterPreview({
  character,
  imageData,
  onConfirm,
  onCancel,
  isImporting = false
}: CharacterPreviewProps) {
  return (
    <div className="character-preview">
      <div className="preview-header">
        <h3>角色预览</h3>
        <p>请确认以下角色信息是否正确</p>
      </div>

      <div className="preview-content">
        {/* 角色头像和基本信息 */}
        <div className="character-basic-info">
          <div className="character-avatar">
            <Image
              src={imageData}
              alt={character.name}
              width={120}
              height={180}
              className="avatar-image"
              unoptimized
            />
          </div>
          
          <div className="character-details">
            <h4 className="character-name">{character.name}</h4>
            <div className="character-meta">
              {character.creator && (
                <span className="creator">创建者: {character.creator}</span>
              )}
              {character.character_version && (
                <span className="version">版本: {character.character_version}</span>
              )}
            </div>
            {character.tags && character.tags.length > 0 && (
              <div className="character-tags">
                {character.tags.slice(0, 5).map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
                {character.tags.length > 5 && (
                  <span className="tag-more">+{character.tags.length - 5}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 角色描述 */}
        {character.description && (
          <div className="preview-section">
            <h5>角色描述</h5>
            <div className="description-content">
              {character.description.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < character.description.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* 角色人设 */}
        {character.personality && (
          <div className="preview-section">
            <h5>角色人设</h5>
            <div className="personality-content">
              {character.personality.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < character.personality.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* 场景设定 */}
        {character.scenario && (
          <div className="preview-section">
            <h5>场景设定</h5>
            <div className="scenario-content">
              {character.scenario.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < character.scenario.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* 首条消息 */}
        {character.first_mes && (
          <div className="preview-section">
            <h5>首条消息</h5>
            <div className="first-message-content">
              {character.first_mes.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < character.first_mes.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* 创建者备注 */}
        {character.creator_notes && (
          <div className="preview-section">
            <h5>创建者备注</h5>
            <div className="creator-notes-content">
              {character.creator_notes.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < character.creator_notes.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="preview-actions">
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isImporting}
        >
          取消
        </button>
        <button
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={isImporting}
        >
          {isImporting ? '导入中...' : '确认导入'}
        </button>
      </div>
    </div>
  );
} 