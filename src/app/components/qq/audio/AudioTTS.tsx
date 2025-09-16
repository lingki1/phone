import React, { useEffect, useMemo, useState } from 'react';
import { fetchVoicesAndStyles, synthesizeToAudioUrl, TtsRole, TtsStyle } from './ttsApi';

interface AudioTTSProps {
  isOpen: boolean;
  onClose: () => void;
  defaultText: string;
}

export default function AudioTTS({ isOpen, onClose, defaultText }: AudioTTSProps) {
  const [voices, setVoices] = useState<Record<string, string>>({});
  const [styles, setStyles] = useState<Record<string, string>>({});
  const [role, setRole] = useState<TtsRole>('zh-CN-XiaoyiNeural');
  const [style, setStyle] = useState<TtsStyle>('cheerful');
  const [loadingList, setLoadingList] = useState(false);
  const [synthLoading, setSynthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
  }, [isOpen, defaultText]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        setLoadingList(true);
        const { voices, styles } = await fetchVoicesAndStyles();
        setVoices(voices);
        setStyles(styles);
        if (voices[role] == null) {
          const firstRole = Object.keys(voices)[0] || 'zh-CN-XiaoyiNeural';
          setRole(firstRole);
        }
        if (styles[style] == null) {
          const firstStyle = Object.keys(styles)[0] || 'cheerful';
          setStyle(firstStyle);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载语音/风格失败');
      } finally {
        setLoadingList(false);
      }
    };
    load();
  }, [isOpen, role, style]);

  const canPlay = useMemo(() => !!defaultText.trim() && !!role, [defaultText, role]);

  const handleSelectChange = async (nextRole?: string, nextStyle?: string) => {
    if (typeof nextRole === 'string') setRole(nextRole);
    if (typeof nextStyle === 'string') setStyle(nextStyle);
    // 选择后立即合成并播放，然后关闭
    try {
      if (!canPlay) return;
      setSynthLoading(true);
      setError(null);
      const url = await synthesizeToAudioUrl({ text: defaultText.trim(), role: nextRole || role, style: nextStyle || style });
      const audio = new Audio(url);
      audio.play().catch(() => {});
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '语音合成失败');
    } finally {
      setSynthLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="tts-modal-backdrop"
      style={{ position: 'fixed', inset: 0, backdropFilter: 'blur(18px)', background: 'rgba(15,15,20,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="tts-modal"
        style={{ width: 'min(460px, 92vw)', background: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 16, padding: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', backdropFilter: 'blur(26px)' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: '#111827', fontWeight: 600 }}>声音</span>
            <select
              value={role}
              onChange={(e) => handleSelectChange(e.target.value, undefined)}
              disabled={loadingList || synthLoading}
              style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.7)' }}
            >
              {Object.entries(voices).map(([k, v]) => (
                <option key={k} value={k}>{v}（{k}）</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: '#111827', fontWeight: 600 }}>风格</span>
            <select
              value={style}
              onChange={(e) => handleSelectChange(undefined, e.target.value)}
              disabled={loadingList || synthLoading}
              style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.7)' }}
            >
              {Object.entries(styles).map(([k, v]) => (
                <option key={k} value={k}>{v}（{k}）</option>
              ))}
            </select>
          </label>
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
}


