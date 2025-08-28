"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import "./ItemDetailModal.css";
import { BlackMarketItem } from "./types";

interface ItemDetailModalProps {
  open: boolean;
  item: BlackMarketItem | null;
  onClose: () => void;
  onDownload: (item: BlackMarketItem) => void;
  onImportCharacter?: (item: BlackMarketItem) => void;
  onImportWorldBook?: (item: BlackMarketItem) => void;
  onDelete?: (item: BlackMarketItem) => void;
  canDelete?: boolean;
}

export default function ItemDetailModal({ 
  open, 
  item, 
  onClose, 
  onDownload, 
  onImportCharacter, 
  onImportWorldBook,
  onDelete,
  canDelete = false
}: ItemDetailModalProps) {
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
        <button className="bm-detail-close" onClick={onClose}>×</button>

        <div className="bm-detail-grid">
          <div className="bm-detail-media">
            {item.thumbnailUrl ? (
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
              <span>作者：{item.author}</span>
              <span>{new Date(item.uploadDate).toLocaleString()}</span>
              <span>📥 {item.downloadCount}</span>
            </div>

            <div className="bm-detail-desc" aria-label="描述">
              {item.description || "无描述"}
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
                  onClick={() => onImportCharacter(item)}
                  title="导入到聊天列表"
                >
                  导入
                </button>
              )}
              {item.type === 'worldbook' && onImportWorldBook && (
                <button 
                  className="import-button" 
                  onClick={() => onImportWorldBook(item)}
                  title="导入到世界书"
                >
                  导入
                </button>
              )}
              <button className="download-button" onClick={() => onDownload(item)}>下载</button>
              {canDelete && onDelete && (
                <button 
                  className="delete-button" 
                  onClick={() => onDelete(item)}
                  title="删除此内容"
                >
                  删除
                </button>
              )}
              <button className="bm-detail-secondary" onClick={onClose}>关闭</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
