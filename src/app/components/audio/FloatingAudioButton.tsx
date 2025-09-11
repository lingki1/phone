'use client';

import { useRef } from 'react';
import { useAudioPlayer } from '@audio/AudioProvider';

export default function FloatingAudioButton() {
  const { isFloating, isMiniFloating, toggleMiniFloating, floatPosition, setFloatPosition, isPlaying, isHighlighting } = useAudioPlayer();
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const originXRef = useRef(0);
  const originYRef = useRef(0);
  const movedRef = useRef(false);
  const draggingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const pendingRef = useRef<{ dx: number; dy: number } | null>(null);

  const clamp = (x: number, y: number) => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 0;
    const h = typeof window !== 'undefined' ? window.innerHeight : 0;
    const size = 48;
    return {
      x: Math.min(Math.max(8, x), Math.max(8, w - size - 8)),
      y: Math.min(Math.max(8, y), Math.max(8, h - size - 8)),
    };
  };

  const startDrag = (clientX: number, clientY: number, target?: Element, pointerId?: number) => {
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = clientX;
    startYRef.current = clientY;
    originXRef.current = floatPosition.x;
    originYRef.current = floatPosition.y;
    if (target && pointerId != null) {
      try {
        const capturable = target as unknown as { setPointerCapture(id: number): void };
        if (typeof capturable.setPointerCapture === 'function') {
          capturable.setPointerCapture(pointerId);
        }
      } catch {}
    }
  };
  const moveDrag = (clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - startXRef.current;
    const dy = clientY - startYRef.current;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    pendingRef.current = { dx, dy };
    if (rafIdRef.current == null) {
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        const p = pendingRef.current;
        if (!p) return;
        const { x, y } = clamp(originXRef.current + p.dx, originYRef.current + p.dy);
        setFloatPosition({ x, y });
      });
    }
  };
  const endDrag = (target?: Element, pointerId?: number) => {
    if (target && pointerId != null) {
      try {
        const capturable = target as unknown as { releasePointerCapture(id: number): void };
        if (typeof capturable.releasePointerCapture === 'function') {
          capturable.releasePointerCapture(pointerId);
        }
      } catch {}
    }
    draggingRef.current = false;
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingRef.current = null;
  };

  if (!isFloating) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
  const ballSize = 48;
  const needLeft = vw ? (vw - (floatPosition.x + ballSize) < 220) : false; // 右侧空间不足，放左侧
  const nearTop = floatPosition.y < 24;
  const _nearBottom = vh ? (vh - (floatPosition.y + ballSize) < 24) : false;
  const bubbleTop = nearTop ? 52 : -10; // 顶部太近则放在下方

  return (
    <div
      style={{
        position: 'fixed',
        left: floatPosition.x,
        top: floatPosition.y,
        zIndex: 2147483647,
        width: 48,
        height: 48,
        borderRadius: 24,
        background: 'rgba(28,28,30,0.65)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isHighlighting ? '0 0 0 12px rgba(255,255,255,0.28), 0 0 0 22px rgba(255,255,255,0.14), 0 20px 56px rgba(0,0,0,0.6)' : '0 8px 28px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.18)',
        border: '1px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(20px)',
        transform: isHighlighting ? 'scale(1.18)' : 'scale(1.0)',
        transition: 'transform 320ms cubic-bezier(.2,.8,.2,1), box-shadow 320ms ease',
        cursor: draggingRef.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto',
        isolation: 'isolate',
        willChange: 'transform',
      }}
      title={isMiniFloating ? '打开播放器' : '最小化悬浮'}
      onPointerDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY, e.currentTarget, e.pointerId); }}
      onPointerMove={(e) => { moveDrag(e.clientX, e.clientY); }}
      onPointerUp={(e) => { endDrag(e.currentTarget, e.pointerId); }}
      onPointerCancel={(e) => { endDrag(e.currentTarget, e.pointerId); }}
      // 统一使用 Pointer 事件，避免被动触摸监听器报错
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (movedRef.current) return;
        toggleMiniFloating();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isMiniFloating ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label="music">
          <path d="M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z"/>
          <path d="M18 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z"/>
          <path d="M9 15V6l12-2v9"/>
        </svg>
      ) : (
        isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="pause">
            <path d="M8 5h3v14H8zM13 5h3v14h-3z"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="play">
            <path d="M7 5v14l12-7z"/>
          </svg>
        )
      )}
      {isHighlighting && (
        <div
          style={{
            position: 'absolute',
            ...(needLeft ? { right: 56 } : { left: 56 }),
            top: bubbleTop,
            maxWidth: '60vw',
            padding: '8px 12px',
            borderRadius: 12,
            background: 'rgba(28,28,30,0.78)',
            color: '#fff',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.18)',
            fontSize: 13,
            lineHeight: 1.2,
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          你的播放器已经打开
        </div>
      )}
    </div>
  );
}


