'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface LocalAudioTrack {
  id: string;
  name: string;
  url: string;
  file?: File;
  duration?: number;
}

interface AudioContextState {
  isOpen: boolean;
  isFloating: boolean;
  isMiniFloating: boolean;
  tracks: LocalAudioTrack[];
  currentTrackId: string | null;
  isPlaying: boolean;
  volume: number; // 0-1
  currentTime: number;
  duration: number;
  floatPosition: { x: number; y: number };
  panelPosition: { left: number; top: number } | null;
  isHighlighting: boolean;
  // actions
  open: () => void;
  close: () => void;
  toggleMiniFloating: () => void;
  addLocalFiles: (files: FileList | File[]) => Promise<void>;
  clearTracks: () => void;
  playTrack: (trackId: string) => void;
  playPause: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
  setFloatPosition: (pos: { x: number; y: number }) => void;
}

const AudioCtx = createContext<AudioContextState | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioProvider');
  return ctx;
}

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isMiniFloating, setIsMiniFloating] = useState(true);
  const [tracks, setTracks] = useState<LocalAudioTrack[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [floatPosition, setFloatPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 24, y: 180 };
    try {
      const raw = localStorage.getItem('audio-float-pos');
      return raw ? JSON.parse(raw) : { x: 24, y: 180 };
    } catch {
      return { x: 24, y: 180 };
    }
  });
  const [panelPosition, setPanelPosition] = useState<{ left: number; top: number } | null>(null);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('audio-float-pos', JSON.stringify(floatPosition));
  }, [floatPosition]);

  const open = useCallback(() => {
    setIsOpen(true);
    setIsFloating(true);
    setIsMiniFloating(true);
    // 触发高亮提醒
    setIsHighlighting(true);
    window.setTimeout(() => setIsHighlighting(false), 1400);
  }, []);

  const close = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } catch {}
    setIsOpen(false);
    setIsFloating(false);
    setIsMiniFloating(true);
    setIsPlaying(false);
  }, []);

  const toggleMiniFloating = useCallback(() => {
    setIsMiniFloating(prev => {
      const next = !prev;
      // 仅当从悬浮球 -> 面板时计算位置（prev 为 true，next 为 false）
      if (prev && typeof window !== 'undefined') {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        // 使用与面板实际渲染一致的动态宽度：min(95vw, 380px)
        const panelWidth = Math.min(Math.floor(vw * 0.95), 380);
        const panelHeight = 300; // 估算面板高度
        const ballSize = 48;
        const gap = 12; // 与球的间距
        const margin = 8; // 距屏幕边

        const bx = floatPosition.x; // ball left
        const by = floatPosition.y; // ball top
        const bcX = bx + ballSize / 2; // ball center X
        const bcY = by + ballSize / 2; // ball center Y

        const clampVertical = (top: number) => Math.min(Math.max(margin, top), Math.max(margin, vh - panelHeight - margin));
        const clampHorizontal = (left: number) => Math.min(Math.max(margin, left), Math.max(margin, vw - panelWidth - margin));

        const canRight = bx + ballSize + gap + panelWidth + margin <= vw;
        const canLeft = panelWidth + gap + margin <= bx;
        const canUp = panelHeight + gap + margin <= by;
        const canDown = by + ballSize + gap + panelHeight + margin <= vh;

        let chosen: { left: number; top: number } | null = null;
        if (canRight) {
          chosen = { left: bx + ballSize + gap, top: clampVertical(bcY - panelHeight / 2) };
        } else if (canLeft) {
          chosen = { left: bx - gap - panelWidth, top: clampVertical(bcY - panelHeight / 2) };
        } else if (canUp) {
          chosen = { left: clampHorizontal(bcX - panelWidth / 2), top: by - gap - panelHeight };
        } else if (canDown) {
          chosen = { left: clampHorizontal(bcX - panelWidth / 2), top: by + ballSize + gap };
        } else {
          // 极端情况下：选择右侧并夹紧，但仍保证与球有 gap 的最小不重叠（若空间不足则贴边）
          const left = Math.max(margin, Math.min(bx + ballSize + gap, vw - panelWidth - margin));
          const top = clampVertical(bcY - panelHeight / 2);
          chosen = { left, top };
        }
        setPanelPosition(chosen);
      }
      return next;
    });
    setIsOpen(true);
    setIsFloating(true);
  }, [floatPosition]);

  const ensureAudioEl = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = 'metadata';
      el.volume = volume;
      el.addEventListener('timeupdate', () => setCurrentTime(el.currentTime));
      el.addEventListener('durationchange', () => setDuration(Number.isFinite(el.duration) ? el.duration : 0));
      el.addEventListener('ended', () => {
        setIsPlaying(false);
        try { window.dispatchEvent(new Event('audio:internal-ended')); } catch {}
      });
      audioRef.current = el;
    }
    return audioRef.current;
  }, [volume]);

  useEffect(() => {
    const el = ensureAudioEl();
    el.volume = volume;
  }, [volume, ensureAudioEl]);

  const addLocalFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    const newTracks: LocalAudioTrack[] = list.map((file) => {
      const url = URL.createObjectURL(file);
      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        url,
        file,
      };
    });
    setTracks(prev => [...prev, ...newTracks]);
    // 导入后自动播放第一个新文件，且保持播放器不关闭
    if (newTracks.length > 0) {
      const firstNewId = newTracks[0].id;
      // 立即打开悬浮（若尚未打开）
      setIsOpen(true);
      setIsFloating(true);
      // 切换到面板或保持当前最小化状态不变
      setCurrentTrackId(firstNewId);
      // 实际播放
      setTimeout(() => {
        try {
          const track = newTracks[0];
          const el = ensureAudioEl();
          if (el.src !== track.url) {
            el.src = track.url;
          }
          el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } catch {}
      }, 0);
    }
  }, [ensureAudioEl]);

  const clearTracks = useCallback(() => {
    setTracks([]);
    setCurrentTrackId(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, []);

  const playTrack = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    const el = ensureAudioEl();
    if (el.src !== track.url) {
      el.src = track.url;
    }
    el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    setCurrentTrackId(trackId);
  }, [tracks, ensureAudioEl]);

  const playPause = useCallback(() => {
    const el = ensureAudioEl();
    if (!el.src) {
      const first = currentTrackId ? tracks.find(t => t.id === currentTrackId) : tracks[0];
      if (first) {
        el.src = first.url;
        setCurrentTrackId(first.id);
      }
    }
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [tracks, currentTrackId, ensureAudioEl]);

  const seek = useCallback((time: number) => {
    const el = ensureAudioEl();
    el.currentTime = Math.max(0, Math.min(time, duration || el.duration || 0));
  }, [duration, ensureAudioEl]);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    if (!currentTrackId) {
      playTrack(tracks[0].id);
      return;
    }
    const idx = tracks.findIndex(t => t.id === currentTrackId);
    const nextIdx = (idx + 1) % tracks.length;
    playTrack(tracks[nextIdx].id);
  }, [tracks, currentTrackId, playTrack]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    if (!currentTrackId) {
      playTrack(tracks[0].id);
      return;
    }
    const idx = tracks.findIndex(t => t.id === currentTrackId);
    const prevIdx = (idx - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIdx].id);
  }, [tracks, currentTrackId, playTrack]);

  useEffect(() => {
    const handler = () => {
      try { next(); } catch {}
    };
    window.addEventListener('audio:internal-ended', handler as EventListener);
    return () => window.removeEventListener('audio:internal-ended', handler as EventListener);
  }, [next]);

  const value = useMemo<AudioContextState>(() => ({
    isOpen,
    isFloating,
    isMiniFloating,
    tracks,
    currentTrackId,
    isPlaying,
    volume,
    currentTime,
    duration,
    floatPosition,
    panelPosition,
    isHighlighting,
    open,
    close,
    toggleMiniFloating,
    addLocalFiles,
    clearTracks,
    playTrack,
    playPause,
    seek,
    setVolume,
    next,
    prev,
    setFloatPosition,
  }), [isOpen, isFloating, isMiniFloating, tracks, currentTrackId, isPlaying, volume, currentTime, duration, floatPosition, panelPosition, isHighlighting, open, close, toggleMiniFloating, addLocalFiles, clearTracks, playTrack, playPause, seek, next, prev]);

  return (
    <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
  );
}


