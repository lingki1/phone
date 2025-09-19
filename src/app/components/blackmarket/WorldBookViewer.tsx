'use client';

import { WorldBook } from './types';
import './WorldBookViewer.css';
import { useI18n } from '../i18n/I18nProvider';

interface WorldBookViewerProps {
  worldbook: WorldBook;
  onDownload: (worldbook: WorldBook) => void;
}

export function WorldBookViewer({ worldbook, onDownload }: WorldBookViewerProps) {
  const { t } = useI18n();
  return (
    <div className="worldbook-viewer">
      <div className="worldbook-header">
        <div className="worldbook-icon">📚</div>
        <div className="worldbook-info">
          <h3>{worldbook.name}</h3>
          <p className="worldbook-author">{t('BlackMarket.worldbook.author', '作者：')}{worldbook.author}</p>
          <p className="worldbook-description">{worldbook.description}</p>
        </div>
      </div>

      <div className="worldbook-stats-grid">
        <div className="stat-item">
          <span className="stat-icon">📝</span>
          <span className="stat-label">{t('BlackMarket.worldbook.entryCount', '条目数量')}</span>
          <span className="stat-value">
            {worldbook.content && typeof worldbook.content === 'object' 
              ? Object.keys(worldbook.content).length 
              : 0}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">📥</span>
          <span className="stat-label">{t('BlackMarket.worldbook.downloads', '下载次数')}</span>
          <span className="stat-value">{worldbook.downloadCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">📅</span>
          <span className="stat-label">{t('BlackMarket.worldbook.uploadDate', '上传日期')}</span>
          <span className="stat-value">{new Date(worldbook.uploadDate).toLocaleDateString()}</span>
        </div>
      </div>

      {worldbook.content && (
        <div className="worldbook-details">
          {(() => {
            const content = worldbook.content as Record<string, unknown>;
            const theme = content.theme;
            if (theme && typeof theme === 'string') {
              return (
                <div className="detail-item">
                  <label>{t('BlackMarket.worldbook.theme', '主题设定:')}</label>
                  <p>{theme}</p>
                </div>
              );
            }
            return null;
          })()}
          
          {(() => {
            const content = worldbook.content as Record<string, unknown>;
            const entries = content.entries;
            if (entries && Array.isArray(entries) && entries.length > 0) {
              return (
                <div className="detail-item">
                  <label>{t('BlackMarket.worldbook.partialPreview', '部分条目预览:')}</label>
                  <div className="entries-preview">
                    {entries.slice(0, 3).map((entry: Record<string, string>, index: number) => (
                      <div key={index} className="entry-preview">
                        <div className="entry-key">{entry.key}</div>
                        <div className="entry-content">
                          {entry.content.length > 100 
                            ? `${entry.content.substring(0, 100)}...` 
                            : entry.content}
                        </div>
                      </div>
                    ))}
                    {entries.length > 3 && (
                      <div className="more-entries">
                        {t('BlackMarket.worldbook.moreEntries', `还有 ${entries.length - 3} 个条目...`)}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      <div className="worldbook-tags">
        {worldbook.tags && worldbook.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      <button 
        className="download-btn"
        onClick={() => onDownload(worldbook)}
      >
        {t('BlackMarket.worldbook.download', '下载世界书')}
      </button>
    </div>
  );
}
