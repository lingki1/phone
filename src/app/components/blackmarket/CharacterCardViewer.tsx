'use client';

import { CharacterCard } from './types';
import './CharacterCardViewer.css';
import Image from 'next/image';

interface CharacterCardViewerProps {
  character: CharacterCard;
  onDownload: (_character: CharacterCard) => void;
}

export function CharacterCardViewer({ character, onDownload: _onDownload }: CharacterCardViewerProps) {
  return (
    <div className="character-card-viewer">
      <div className="character-header">
        {character.thumbnailUrl && (
          <Image 
            src={character.thumbnailUrl} 
            alt={character.name}
            className="character-avatar"
            width={80}
            height={80}
          />
        )}
        <div className="character-info">
          <h3>{character.name}</h3>
          <p className="character-author">作者：{character.author}</p>
          <p className="character-description">{character.description}</p>
        </div>
      </div>

      {character.metadata && (
        <div className="character-details">
          {(character.metadata as Record<string, string>).personality && (
            <div className="detail-item">
              <label>性格特征:</label>
              <p>{(character.metadata as Record<string, string>).personality}</p>
            </div>
          )}
          
          {(character.metadata as Record<string, string>).scenario && (
            <div className="detail-item">
              <label>设定场景:</label>
              <p>{(character.metadata as Record<string, string>).scenario}</p>
            </div>
          )}
          
          {(character.metadata as Record<string, string>).firstMessage && (
            <div className="detail-item">
              <label>开场白:</label>
              <p className="first-message">&quot;{(character.metadata as Record<string, string>).firstMessage}&quot;</p>
            </div>
          )}
          
          {(character.metadata as Record<string, string>).exampleDialogue && (
            <div className="detail-item">
              <label>对话示例:</label>
              <div className="example-dialogue">
                {(character.metadata as Record<string, string>).exampleDialogue}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="character-tags">
        {character.tags && character.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      <div className="character-stats">
        <span>🔥 {character.downloadCount} 热度</span>
        <span>📅 {new Date(character.uploadDate).toLocaleDateString()}</span>
      </div>

      {/* 下载按钮已移除 */}
    </div>
  );
}
