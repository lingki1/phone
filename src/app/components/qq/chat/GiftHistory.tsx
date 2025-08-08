'use client';

import React, { useEffect, useState } from 'react';
import type { ChatItem } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';

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

  return (
    <div className="gift-history-overlay" onClick={onClose}>
      <div className="gift-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gift-history-header">
          <h3>礼物记录</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="gift-history-content">
          {isLoading ? (
            <div>加载中...</div>
          ) : gifts.length === 0 ? (
            <div>暂无礼物记录</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {gifts.map(g => (
                <li key={g.id} style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <strong>{g.fromUser}</strong> 赠送给 <strong>{g.toUser}</strong>
                    </span>
                    <span style={{ color: '#f60' }}>¥{g.amount.toFixed(2)}</span>
                  </div>
                  {g.items && g.items.length > 0 && (
                    <div style={{ marginTop: 6, color: '#555' }}>
                      {g.items.map((it, idx) => (
                        <div key={idx}>
                          {it.name} × {it.quantity}（¥{it.unitPrice.toFixed(2)}）
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                    配送：{g.shippingMethod === 'instant' ? '极速立刻' : g.shippingMethod === 'fast' ? '快速1分钟' : '慢速10分钟'} · {new Date(g.timestamp).toLocaleString('zh-CN')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <style jsx>{`
        .gift-history-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index: 1000; }
        .gift-history-modal { width: 520px; max-width: 92vw; background:#fff; border-radius:10px; box-shadow: 0 8px 30px rgba(0,0,0,.2); }
        .gift-history-header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #eee; }
        .gift-history-content { padding: 12px 14px; max-height: 60vh; overflow:auto; }
      `}</style>
    </div>
  );
}


