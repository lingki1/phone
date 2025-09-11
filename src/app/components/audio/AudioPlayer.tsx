'use client';

import { useMemo } from 'react';
import { useAudioPlayer } from '@audio/AudioProvider';

export default function AudioPlayer() {
  const {
    isOpen,
    isMiniFloating,
    panelPosition,
    tracks,
    currentTrackId,
    isPlaying,
    volume,
    currentTime,
    duration,
    close,
    addLocalFiles,
    clearTracks,
    playTrack,
    playPause,
    seek,
    setVolume,
    next,
    prev,
    toggleMiniFloating,
  } = useAudioPlayer();

  const current = useMemo(() => tracks.find(t => t.id === currentTrackId) || null, [tracks, currentTrackId]);

  if (!isOpen || isMiniFloating) return null;

  const fmt = (sec: number) => {
    if (!Number.isFinite(sec)) return '00:00';
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
    {/* 全屏透明遮罩：点击最小化（隐藏面板，保留悬浮） */}
    <div
      onClick={() => toggleMiniFloating()}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'transparent' }}
    />
    <div
      style={{
        position: 'fixed',
        left: panelPosition ? panelPosition.left : undefined,
        top: panelPosition ? panelPosition.top : undefined,
        right: panelPosition ? undefined : 16,
        bottom: panelPosition ? undefined : 16,
        width: 'min(95vw, 380px)',
        borderRadius: 20,
        background: 'rgba(28,28,30,0.7)',
        color: '#fff',
        boxShadow: '0 18px 44px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.18)',
        zIndex: 10001,
        overflow: 'hidden',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)'
      }}
    >
      
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ fontWeight: 700, letterSpacing: 0.4 }}>音乐</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => clearTracks()} style={glassBtn()}>清空</button>
          <button
            onClick={() => {
              alert('这个不是隐藏，是关闭播放器功能');
              close();
            }}
            style={glassBtn()}
          >关闭</button>
        </div>
      </div>

      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="file"
            accept="audio/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) addLocalFiles(files);
              e.currentTarget.value = '';
            }}
          />
          <span style={glassBtn()}>选择本地音乐</span>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          <div style={{ fontWeight: 600, minHeight: 24, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={current?.name || ''}>{current?.name || '未选择音轨'}</div>
          <div style={{ opacity: 0.8 }}>{fmt(currentTime)} / {fmt(duration)}</div>
        </div>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          style={{ WebkitAppearance: 'none', appearance: 'none', height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.22)', outline: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={iconBtn()} onClick={() => prev()}>{iconPrev()}</button>
          <button style={iconBtn(56)} onClick={() => playPause()}>{isPlaying ? iconPause() : iconPlay()}</button>
          <button style={iconBtn()} onClick={() => next()}>{iconNext()}</button>
          <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ opacity: 0.85 }}>音量</span>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
          </div>
        </div>

        <div style={{ maxHeight: 'min(40vh, 220px)', overflow: 'auto', borderRadius: 8, background: 'rgba(255,255,255,0.04)', padding: 8 }}>
          {tracks.length === 0 && (
            <div style={{ opacity: 0.7 }}>暂无播放列表，点击“选择本地音乐”添加文件。</div>
          )}
          {tracks.map((t, i) => (
            <div
              key={t.id}
              onDoubleClick={() => playTrack(t.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr auto',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                background: t.id === currentTrackId ? 'rgba(59,130,246,0.18)' : 'transparent',
                cursor: 'default',
              }}
              title="双击播放"
            >
              <div>{t.id === currentTrackId ? '🎧' : '🎵'}</div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {t.name}</div>
              <button style={glassBtn()} onClick={() => playTrack(t.id)}>播放</button>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

function glassBtn(): React.CSSProperties {
  return {
    border: 'none',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 999,
    cursor: 'pointer',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)'
  };
}

function iconBtn(size = 44): React.CSSProperties {
  return {
    border: 'none',
    width: size,
    height: size,
    borderRadius: size / 2,
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)'
  };
}

function iconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-label="play">
      <path d="M7 5v14l12-7z"/>
    </svg>
  );
}

function iconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-label="pause">
      <path d="M8 5h3v14H8zM13 5h3v14h-3z"/>
    </svg>
  );
}

function iconPrev() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-label="prev">
      <path d="M6 6h2v12H6z"/>
      <path d="M20 18l-10-6 10-6v12z"/>
    </svg>
  );
}

function iconNext() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-label="next">
      <path d="M16 6h2v12h-2z"/>
      <path d="M4 18l10-6L4 6v12z"/>
    </svg>
  );
}


