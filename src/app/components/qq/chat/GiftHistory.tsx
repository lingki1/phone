'use client';

import React, { useEffect, useState } from 'react';
import type { ChatItem } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import { useCurrentTheme } from '../../../hooks/useTheme';
import { useI18n } from '../../i18n/I18nProvider';
import './GiftHistory.css';

interface GiftRecord {
  id: string;
  amount: number;
  fromUser: string;
  toUser: string;
  items?: { productId: string; name: string; quantity: number; unitPrice: number }[];
  shippingMethod?: 'instant' | 'fast' | 'slow';
  timestamp: number;
}

interface GiftHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatItem;
}

export default function GiftHistory({ isOpen, onClose, chat }: GiftHistoryProps) {
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentThemeObject } = useCurrentTheme();
  void currentThemeObject; // avoid unused var warning
  const { t, locale } = useI18n();

  useEffect(() => {
    const loadGifts = async () => {
      if (!isOpen) return;
      try {
        setIsLoading(true);
        await dataManager.initDB();
        const tx = await dataManager.getTransactionsByChatId(chat.id);
        const giftTx = tx
          .filter(t => t.message && typeof t.message === 'string' && (t.message as string).includes('gift_purchase'))
          .map(t => {
            let parsed: { kind?: string; items?: Array<{ productId: string; name: string; quantity: number; unitPrice: number }>; shippingMethod?: string } = {};
            try { parsed = JSON.parse(t.message || '{}'); } catch {}
            return {
              id: t.id,
              amount: t.amount,
              fromUser: t.fromUser,
              toUser: t.toUser,
              items: parsed.items || [],
              shippingMethod: parsed.shippingMethod,
              timestamp: t.timestamp,
            } as GiftRecord;
          })
          .sort((a, b) => b.timestamp - a.timestamp);
        setGifts(giftTx);
      } finally {
        setIsLoading(false);
      }
    };
    loadGifts();
  }, [isOpen, chat.id]);

  if (!isOpen) return null;

  const getShippingMethodText = (method?: string) => {
    switch (method) {
      case 'instant': return t('QQ.ChatInterface.GiftHistory.shipping.instant', '极速立刻');
      case 'fast': return t('QQ.ChatInterface.GiftHistory.shipping.fast', '快速1分钟');
      case 'slow': return t('QQ.ChatInterface.GiftHistory.shipping.slow', '慢速10分钟');
      default: return t('QQ.ChatInterface.GiftHistory.shipping.standard', '标准配送');
    }
  };

  const getShippingMethodColor = (method?: string) => {
    switch (method) {
      case 'instant': return '#ff4757';
      case 'fast': return '#ffa502';
      case 'slow': return '#2ed573';
      default: return '#747d8c';
    }
  };

  return (
    <div className="gift-history-overlay" onClick={onClose}>
      <div className="gift-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gift-history-header">
          <div className="gift-history-title">
            <div className="gift-icon">🎁</div>
            <h3>{t('QQ.ChatInterface.GiftHistory.title', '礼物记录')}</h3>
            <span className="gift-count">{t('QQ.ChatInterface.GiftHistory.count', '{{count}} 条记录').replace('{{count}}', String(gifts.length))}</span>
          </div>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="gift-history-content">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('QQ.ChatInterface.GiftHistory.loading', '正在加载礼物记录...')}</p>
            </div>
          ) : gifts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎁</div>
              <h4>{t('QQ.ChatInterface.GiftHistory.empty.title', '暂无礼物记录')}</h4>
              <p>{t('QQ.ChatInterface.GiftHistory.empty.desc', '这里会显示您收到的所有礼物')}</p>
            </div>
          ) : (
            <div className="gift-list">
              {gifts.map((gift, index) => (
                <div key={gift.id} className="gift-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="gift-header">
                    <div className="gift-users">
                      <span className="from-user">{gift.fromUser}</span>
                      <div className="gift-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </div>
                      <span className="to-user">{gift.toUser}</span>
                    </div>
                    <div className="gift-amount">
                      <span className="amount-symbol">¥</span>
                      <span className="amount-value">{gift.amount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {gift.items && gift.items.length > 0 && (
                    <div className="gift-items">
                      <div className="gift-items-header">
                        <span className="gift-items-title">{t('QQ.ChatInterface.GiftHistory.itemsTitle', '🎁 礼品清单')}</span>
                      </div>
                      {gift.items.map((item, idx) => (
                        <div key={idx} className="gift-item">
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span className="gift-item-quantity">× {item.quantity}</span>
                          </div>
                          <span className="item-price">¥{item.unitPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="gift-footer">
                    <div className="shipping-info">
                      <span 
                        className="shipping-method"
                        style={{ color: getShippingMethodColor(gift.shippingMethod) }}
                      >
                        {getShippingMethodText(gift.shippingMethod)}
                      </span>
                    </div>
                    <div className="gift-time">
                      {new Date(gift.timestamp).toLocaleString(locale || 'zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


