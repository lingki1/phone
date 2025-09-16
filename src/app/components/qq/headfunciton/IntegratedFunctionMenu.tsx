import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChatItem } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import { useI18n } from '../../i18n/I18nProvider';
import './IntegratedFunctionMenu.css';
import { fetchVoicesAndStyles } from '../audio/ttsApi';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface IntegratedFunctionMenuProps {
  chat: ChatItem;
  onShowWorldBookAssociationSwitch: () => void;
  onShowExtraInfoSettings: () => void;
  onShowBackgroundModal: () => void;
  onShowGiftHistory: () => void;
  onShowMemoryManager: () => void;
  onShowMemberManager: () => void;
  onShowSingleChatMemoryManager: () => void;
  personalSettings?: PersonalSettings;
  dbPersonalSettings?: PersonalSettings | null;
}

export default function IntegratedFunctionMenu({
  chat,
  onShowWorldBookAssociationSwitch,
  onShowExtraInfoSettings,
  onShowBackgroundModal,
  onShowGiftHistory,
  onShowMemoryManager,
  onShowMemberManager,
  onShowSingleChatMemoryManager,
  personalSettings,
  dbPersonalSettings
}: IntegratedFunctionMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [, setPersonaOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'root' | 'persona' | 'voice'>('root');
  const [personaList, setPersonaList] = useState<Array<{ id: string; userAvatar: string; userNickname: string; userBio: string; isActive?: boolean }>>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [voiceList, setVoiceList] = useState<Record<string, string>>({});
  const [styleList, setStyleList] = useState<Record<string, string>>({});
  const [selectedVoice, setSelectedVoice] = useState<string>('zh-CN-XiaoyiNeural');
  const [selectedStyle, setSelectedStyle] = useState<string>('cheerful');

  // 仅展示中文语音（键以 zh-CN- 开头）；若找不到则回退全部
  const chineseVoices = useMemo(() => {
    const zhEntries = Object.entries(voiceList).filter(([k]) => k.startsWith('zh-CN-'));
    return zhEntries.length > 0 ? Object.fromEntries(zhEntries) : voiceList;
  }, [voiceList]);

  // Load persona list lazily when persona section opens (for performance)
  useEffect(() => {
    if (activePanel !== 'persona') return;
    const load = async () => {
      try {
        await dataManager.initDB();
        const all = await dataManager.getAllPersonalSettingsFromCollection();
        setPersonaList(all);
      } catch {}
    };
    load();
  }, [activePanel]);

  // Load TTS lists when menu opens, and init selections from localStorage
  useEffect(() => {
    if (!open) return;
    const loadTts = async () => {
      try {
        const { voices, styles } = await fetchVoicesAndStyles();
        setVoiceList(voices);
        setStyleList(styles);
      } catch {}
      try {
        const v = localStorage.getItem(`tts_voice_${chat.id}`);
        const s = localStorage.getItem(`tts_style_${chat.id}`);
        if (v) setSelectedVoice(v);
        if (s) setSelectedStyle(s);
      } catch {}
    };
    loadTts();
  }, [open, chat.id]);

  // Close on outside click / ESC
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
        setPersonaOpen(false);
        setActivePanel('root');
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setPersonaOpen(false);
        setActivePanel('root');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const handleQuickSelectPersona = useCallback(async (id: string) => {
    try {
      await dataManager.initDB();
      await dataManager.setActivePersonalSettings(id);
      const all = await dataManager.getAllPersonalSettingsFromCollection();
      setPersonaList(all);
      const picked = all.find(p => p.id === id);
      if (picked) {
        const newSettings = { userAvatar: picked.userAvatar, userNickname: picked.userNickname, userBio: picked.userBio };
        try {
          await dataManager.savePersonalSettings(newSettings);
        } catch {}
        window.dispatchEvent(new CustomEvent('personalSettingsUpdated', { detail: { settings: newSettings } }));
      }
      setPersonaOpen(false);
      setActivePanel('root');
      setOpen(false);
    } catch {
      alert(t('QQ.ChatInterface.persona.switchFailed', '切换人设失败，请重试'));
    }
  }, [t]);

  const currentUserNickname = useMemo(() => dbPersonalSettings?.userNickname || personalSettings?.userNickname || '我', [dbPersonalSettings?.userNickname, personalSettings?.userNickname]);

  return (
    <div className="ifm-root" ref={rootRef}>
      <button
        className={`ifm-trigger ${open ? 'open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        title={t('QQ.ChatInterface.actions.menu', '功能菜单')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
        <span className="ifm-trigger-text">{t('QQ.ChatInterface.actions.more', '更多')}</span>
      </button>

      {open && (
        <div className="ifm-menu" role="menu">
          <div className={`ifm-panels ${activePanel !== 'root' ? 'persona-active' : 'root-active'}`}>
            <div className="ifm-panel ifm-panel-root">
              <div className="ifm-actions">
                <button className="ifm-item" role="menuitem" onClick={() => { setOpen(false); onShowWorldBookAssociationSwitch(); }}>
                  <div className="ifm-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0-3-3h7z"/>
                    </svg>
                  </div>
                  <div className="ifm-text">
                    <div className="ifm-label">{t('QQ.ChatInterface.title.worldBook', '世界书关联管理')}</div>
                  </div>
                </button>

                <button className="ifm-item" role="menuitem" onClick={() => { setOpen(false); onShowExtraInfoSettings(); }}>
                  <div className="ifm-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div className="ifm-text">
                    <div className="ifm-label">{t('QQ.ChatInterface.title.extraInfo', '设置额外信息')}</div>
                  </div>
                </button>

                <button className="ifm-item" role="menuitem" onClick={() => { setOpen(false); onShowBackgroundModal(); }}>
                  <div className="ifm-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                  </div>
                  <div className="ifm-text">
                    <div className="ifm-label">{t('QQ.ChatInterface.title.chatBackground', '设置聊天背景')}</div>
                  </div>
                </button>

                <button className="ifm-item" role="menuitem" onClick={() => { setOpen(false); onShowGiftHistory(); }}>
                  <div className="ifm-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,12 20,22 4,22 4,12"/>
                      <rect x="2" y="7" width="20" height="5"/>
                      <line x1="12" y1="22" x2="12" y2="7"/>
                    </svg>
                  </div>
                  <div className="ifm-text">
                    <div className="ifm-label">{t('QQ.ChatInterface.title.giftHistory', '查看礼物记录')}</div>
                  </div>
                </button>

                {chat.isGroup ? (
                  <>
                    <button className="ifm-item" role="menuitem" onClick={() => { setOpen(false); onShowMemoryManager(); }}>
                      <div className="ifm-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                      <div className="ifm-text">
                        <div className="ifm-label">{t('QQ.ChatInterface.title.memoryManager', '记忆管理')}</div>
                      </div>
                    </button>

                    <button className="ifm-item" role="menuitem" onClick={() => { setOpen(false); onShowMemberManager(); }}>
                      <div className="ifm-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div className="ifm-text">
                        <div className="ifm-label">{t('QQ.ChatInterface.title.groupMemberManager', '群成员管理')}</div>
                      </div>
                    </button>
                  </>
                ) : (
                  <button className="ifm-item" role="menuitem" onClick={() => { setOpen(false); onShowSingleChatMemoryManager(); }}>
                    <div className="ifm-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div className="ifm-text">
                      <div className="ifm-label">{t('QQ.ChatInterface.title.singleChatMemoryManager', '单聊记忆管理')}</div>
                    </div>
                  </button>
                )}
              </div>

              <div className="ifm-section">
                <button className="ifm-section-toggle" onClick={() => { setActivePanel('voice'); }}>
                  <div className="ifm-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1v22"/>
                      <path d="M17 5v14"/>
                      <path d="M7 8v8"/>
                    </svg>
                  </div>
                  <div className="ifm-text">
                    <div className="ifm-label">{t('QQ.ChatInterface.tts.voiceEntry', '{{name}} 的声音选择').replace('{{name}}', chat.name)}</div>
                  </div>
                  <div className="ifm-caret">›</div>
                </button>
                <button className="ifm-section-toggle" onClick={() => { setActivePanel('persona'); }}>
                  <div className="ifm-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="7" r="4"/>
                      <path d="M5.5 22a6.5 6.5 0 0 1 13 0"/>
                    </svg>
                  </div>
                  <div className="ifm-text">
                    <div className="ifm-label">{t('QQ.ChatInterface.title.switchPersona', '快速切换人设')}</div>
                  </div>
                  <div className="ifm-caret">›</div>
                </button>
              </div>
            </div>

            {activePanel === 'persona' && (
              <div className="ifm-panel ifm-panel-persona">
                <div className="ifm-panel-header">
                  <button className="ifm-back" onClick={() => { setActivePanel('root'); }} aria-label="back">‹</button>
                  <div className="ifm-panel-title">{t('QQ.ChatInterface.persona.current', '当前人设：')}{currentUserNickname}</div>
                </div>
                <div className="ifm-panel-body">
                  <div className="ifm-persona-list">
                    {personaList.length === 0 ? (
                      <div className="ifm-empty">{t('QQ.ChatInterface.persona.empty', '暂无保存的人设')}</div>
                    ) : (
                      personaList.map(p => (
                        <button key={p.id} className={`ifm-persona-item ${p.isActive ? 'active' : ''}`} onClick={() => handleQuickSelectPersona(p.id)}>
                          <div className="ifm-persona-avatar">
                            <Image src={p.userAvatar || '/avatars/user-avatar.svg'} alt={p.userNickname || 'P'} width={28} height={28} unoptimized={p.userAvatar?.startsWith?.('data:')} />
                          </div>
                          <div className="ifm-persona-text">
                            <div className="ifm-persona-name">{p.userNickname || t('QQ.ChatInterface.persona.unnamed', '未命名')}</div>
                            <div className="ifm-persona-bio">{(p.userBio || '').slice(0, 40)}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'voice' && (
              <div className="ifm-panel ifm-panel-voice">
                <div className="ifm-panel-header">
                  <button className="ifm-back" onClick={() => { setActivePanel('root'); }} aria-label="back">‹</button>
                  <div className="ifm-panel-title">{t('QQ.ChatInterface.tts.pickVoice', '{{name}} 的声音选择').replace('{{name}}', chat.name)}</div>
                </div>
                <div className="ifm-panel-body">
                  <div className="ifm-tts">
                    <div className="ifm-tts-row" style={{ display: 'block' }}>
                      <div className="ifm-tts-label" style={{ marginBottom: 8 }}>{t('QQ.ChatInterface.tts.voice', '人声')}</div>
                      <div className="ifm-tts-chips">
                        {Object.entries(chineseVoices).map(([k, v]) => {
                          const label = t(`QQ.TTS.voiceNames.${k}`, v);
                          const selected = selectedVoice === k;
                          return (
                            <button
                              key={k}
                              className={`ifm-tts-chip ${selected ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedVoice(k);
                                try { localStorage.setItem(`tts_voice_${chat.id}`, k); } catch {}
                              }}
                              title={k}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="ifm-tts-row" style={{ display: 'block' }}>
                      <div className="ifm-tts-label" style={{ marginBottom: 8 }}>{t('QQ.ChatInterface.tts.style', '语气')}</div>
                      <div className="ifm-tts-chips">
                        {Object.entries(styleList).map(([k, v]) => {
                          const selected = selectedStyle === k;
                          return (
                            <button
                              key={k}
                              className={`ifm-tts-chip ${selected ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedStyle(k);
                                try { localStorage.setItem(`tts_style_${chat.id}`, k); } catch {}
                              }}
                              title={t(`QQ.TTS.styleNames.${k}`, v)}
                            >
                              {t(`QQ.TTS.styleNames.${k}`, v)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


