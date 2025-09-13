import React from 'react';
import Image from 'next/image';
import { PreviewCharacter } from './types';
import { useI18n } from '../../i18n/I18nProvider';
import './CharacterPreview.css';

interface CharacterPreviewProps {
  character: PreviewCharacter;
  onImport: () => void;
  onCancel: () => void;
}

export default function CharacterPreview({ character, onImport, onCancel }: CharacterPreviewProps) {
  const { t } = useI18n();
  // 合并后的人设内容
  const combinedPersona = [character.persona, character.description]
    .filter(Boolean)
    .join('\n\n');

  return (
    <div className="character-preview">
      <div className="preview-header">
        <h3>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.title', '角色预览')}</h3>
        <p>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.subtitle', '确认信息无误后导入角色')}</p>
      </div>

      <div className="preview-content">
        {/* 基本信息卡片 */}
        <div className="info-card">
          <div className="avatar-section">
            <Image
              src={character.avatar}
              alt={character.name}
              width={60}
              height={60}
              className="avatar"
              unoptimized
            />
            <div className="name-section">
              <h4>{character.name}</h4>
              <span className="creator">
                {typeof character.originalData.creator === 'string' && character.originalData.creator ? `by ${character.originalData.creator}` : t('QQ.ChatInterface.CharacterImport.CharacterPreview.unknownCreator', '未知创建者')}
              </span>
            </div>
          </div>
        </div>

        {/* 人设内容 */}
        <div className="info-card">
          <h5>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.persona.title', '角色人设')}</h5>
          <div className="persona-content">
            {combinedPersona ? (
              <p>{combinedPersona}</p>
            ) : (
              <p className="empty">{t('QQ.ChatInterface.CharacterImport.CharacterPreview.persona.empty', '暂无角色人设')}</p>
            )}
          </div>
        </div>

        {/* 开场白信息 */}
        {typeof character.originalData.first_mes === 'string' && character.originalData.first_mes && (
          <div className="info-card first-message-card">
            <h5>🎭 {t('QQ.ChatInterface.CharacterImport.CharacterPreview.firstMessage.title', '剧情模式开场白')}</h5>
            <div className="first-message-content">
              <p>{character.originalData.first_mes}</p>
              <div className="first-message-note">
                <small>💡 {t('QQ.ChatInterface.CharacterImport.CharacterPreview.firstMessage.note', '导入后，在剧情模式中首次进入时会自动发送此开场白')}</small>
              </div>
            </div>
          </div>
        )}

        {/* 关键信息 */}
        <div className="info-card">
          <h5>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.info.title', '角色信息')}</h5>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">{t('QQ.ChatInterface.CharacterImport.CharacterPreview.info.version', '版本')}</span>
              <span className="value">{typeof character.originalData.character_version === 'string' ? character.originalData.character_version : 'v1'}</span>
            </div>
            <div className="info-item">
              <span className="label">{t('QQ.ChatInterface.CharacterImport.CharacterPreview.info.tags', '标签')}</span>
              <span className="value">
                {Array.isArray(character.originalData.tags) && character.originalData.tags.length > 0 
                  ? character.originalData.tags.slice(0, 3).join(', ')
                  : t('QQ.ChatInterface.CharacterImport.CharacterPreview.info.none', '无')}
                {Array.isArray(character.originalData.tags) && character.originalData.tags.length > 3 && '...'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">{t('QQ.ChatInterface.CharacterImport.CharacterPreview.info.scenario', '场景')}</span>
              <span className="value">
                {typeof character.originalData.scenario === 'string' && character.originalData.scenario 
                  ? (character.originalData.scenario.length > 50 
                    ? character.originalData.scenario.substring(0, 50) + '...'
                    : character.originalData.scenario)
                  : t('QQ.ChatInterface.CharacterImport.CharacterPreview.info.none', '无')}
              </span>
            </div>
          </div>
        </div>

        {/* 扩展信息 (可折叠) */}
        {(typeof character.originalData.first_mes === 'string' && character.originalData.first_mes || 
          typeof character.originalData.mes_example === 'string' && character.originalData.mes_example || 
          typeof character.originalData.creator_notes === 'string' && character.originalData.creator_notes ||
          typeof character.originalData.post_history_instructions === 'string' && character.originalData.post_history_instructions ||
          typeof character.originalData.world_scenario === 'string' && character.originalData.world_scenario ||
          typeof character.originalData.character_book === 'string' && character.originalData.character_book) && (
          <div className="info-card">
            <details className="extended-info">
              <summary>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.extended.viewDetails', '查看详细信息')}</summary>
              <div className="extended-content">
                {typeof character.originalData.first_mes === 'string' && character.originalData.first_mes && (
                  <div className="extended-item">
                    <h6>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.extended.firstMessage', '首次消息')}</h6>
                    <p>{character.originalData.first_mes}</p>
                  </div>
                )}
                {typeof character.originalData.mes_example === 'string' && character.originalData.mes_example && (
                  <div className="extended-item">
                    <h6>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.extended.exampleDialogue', '示例对话')}</h6>
                    <p>{character.originalData.mes_example}</p>
                  </div>
                )}
                {typeof character.originalData.creator_notes === 'string' && character.originalData.creator_notes && (
                  <div className="extended-item">
                    <h6>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.extended.creatorNotes', '创建者备注')}</h6>
                    <p>{character.originalData.creator_notes}</p>
                  </div>
                )}
                {typeof character.originalData.post_history_instructions === 'string' && character.originalData.post_history_instructions && (
                  <div className="extended-item">
                    <h6>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.extended.historyInstructions', '历史指令')}</h6>
                    <p>{character.originalData.post_history_instructions}</p>
                  </div>
                )}
                {typeof character.originalData.world_scenario === 'string' && character.originalData.world_scenario && (
                  <div className="extended-item">
                    <h6>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.extended.worldScenario', '世界设定')}</h6>
                    <p>{character.originalData.world_scenario}</p>
                  </div>
                )}
                {typeof character.originalData.character_book === 'string' && character.originalData.character_book && (
                  <div className="extended-item">
                    <h6>{t('QQ.ChatInterface.CharacterImport.CharacterPreview.extended.characterBook', '角色书')}</h6>
                    <p>{character.originalData.character_book}</p>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="preview-actions">
        <button className="btn btn-cancel" onClick={onCancel}>
          {t('QQ.ChatInterface.CharacterImport.CharacterPreview.buttons.cancel', '取消')}
        </button>
        <button className="btn btn-import" onClick={onImport}>
          {t('QQ.ChatInterface.CharacterImport.CharacterPreview.buttons.import', '导入角色')}
        </button>
      </div>
    </div>
  );
} 