"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import "./ItemDetailModal.css";
import { BlackMarketItem } from "./types";
import { useI18n } from "../../components/i18n/I18nProvider";

interface ItemDetailModalProps {
  open: boolean;
  item: BlackMarketItem | null;
  onClose: () => void;
  onDownload: (_item: BlackMarketItem) => void;
  onImportCharacter?: (item: BlackMarketItem) => void;
  onImportWorldBook?: (item: BlackMarketItem) => void;
  onDelete?: (item: BlackMarketItem) => void;
  canDelete?: boolean;
  busy?: boolean;
}

export default function ItemDetailModal({ 
  open, 
  item, 
  onClose, 
  onDownload: _onDownload, 
  onImportCharacter, 
  onImportWorldBook,
  onDelete,
  canDelete = false,
  busy = false
}: ItemDetailModalProps) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  return (
    <div className="bm-detail-modal" role="dialog" aria-modal="true">
      <div className="bm-detail-container">
        <button className="bm-detail-close" onClick={onClose} disabled={busy}>×</button>

        <div className="bm-detail-grid">
          <div className="bm-detail-media">
            {item.type === 'character' ? (
              (() => {
                const highUrl = (item as { thumbnails?: { large?: string } }).thumbnails?.large;
                const previewUrl = item.thumbnailUrl as string | undefined;
                const fallbackUrl = item.fileUrl as string | undefined;
                const src = highUrl || previewUrl || fallbackUrl || '/avatars/default-avatar.svg';
                return (
                  <Image
                    src={src}
                    alt={item.name}
                    className="bm-detail-image"
                    width={900}
                    height={1600}
                    priority
                    quality={90}
                  />
                );
              })()
            ) : item.thumbnailUrl ? (
              <Image
                src={item.thumbnailUrl}
                alt={item.name}
                className="bm-detail-image"
                width={720}
                height={1280}
              />
            ) : item.type === 'worldbook' ? (
              <div className="bm-detail-worldbook-preview">
                <div className="bm-detail-worldbook-title">{item.name}</div>
                <div className="bm-detail-worldbook-icon">📚</div>
              </div>
            ) : null}
          </div>

          <div className="bm-detail-info">
            <h3 className="bm-detail-title">{item.name}</h3>
            <div className="bm-detail-meta">
              <span>{t('BlackMarket.detail.author', '作者：')}{item.author}</span>
              <span>{new Date(item.uploadDate).toLocaleString()}</span>
              <span>🔥 {item.downloadCount}</span>
            </div>

            <div className="bm-detail-desc" aria-label={t('BlackMarket.detail.descAria', '描述')}>
              {item.description || t('BlackMarket.detail.noDesc', '无描述')}
            </div>

            <div className="bm-detail-tags">
              {item.tags?.map(tag => (
                <span key={tag} className="bm-detail-tag">{tag}</span>
              ))}
            </div>

            <div className="bm-detail-actions">
              {item.type === 'character' && onImportCharacter && (
                <button 
                  className="import-button" 
                  onClick={() => { if (!busy) onImportCharacter(item); }}
                  title={t('BlackMarket.import.toChat', '导入到聊天列表')}
                  disabled={busy}
                >
                  {busy ? t('BlackMarket.import.importing', '导入中...') : t('BlackMarket.import.button', '导入')}
                </button>
              )}
              {item.type === 'worldbook' && onImportWorldBook && (
                <button 
                  className="import-button" 
                  onClick={() => { if (!busy) onImportWorldBook(item); }}
                  title={t('BlackMarket.import.toWorldBook', '导入到世界书')}
                  disabled={busy}
                >
                  {busy ? t('BlackMarket.import.importing', '导入中...') : t('BlackMarket.import.button', '导入')}
                </button>
              )}
              {/* 下载按钮已移除 */}
              {canDelete && onDelete && (
                <button 
                  className="delete-button" 
                  onClick={() => { if (!busy) onDelete(item); }}
                  title={t('BlackMarket.delete.this', '删除此内容')}
                  disabled={busy}
                >
                  {t('BlackMarket.delete.button', '删除')}
                </button>
              )}
              <button className="bm-detail-secondary" onClick={onClose} disabled={busy}>{t('BlackMarket.detail.close', '关闭')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
