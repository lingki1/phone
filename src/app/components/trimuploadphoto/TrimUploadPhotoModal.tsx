'use client';

import { useEffect, useRef, useState } from 'react';
import './TrimUploadPhotoModal.css';

interface TrimUploadPhotoModalProps {
  visible: boolean;
  imageSrc: string; // can be objectURL or dataURL
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void; // square cropped result (dataURL)
  cropSize?: number; // display crop box size in px
}

/**
 * 轻量级头像裁剪组件（方形裁剪，适配圆形头像显示）
 * - 支持拖拽平移、滚轮缩放
 * - 固定方形裁剪框，导出正方形 dataURL
 */
export default function TrimUploadPhotoModal({
  visible,
  imageSrc,
  onCancel,
  onConfirm,
  cropSize = 260
}: TrimUploadPhotoModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1); // 用户交互缩放因子
  const [baseScale, setBaseScale] = useState(1); // 使短边适配裁剪框的基准缩放
  const [_naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ 
    dragging: boolean; 
    startX: number; 
    startY: number; 
    startPosX: number; 
    startPosY: number;
    pinchDist?: number;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0
  });

  useEffect(() => {
    if (!visible) return;
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setImageLoaded(false);
    setNaturalSize(null);
    setBaseScale(1);
  }, [visible, imageSrc]);

  // 使用原生 wheel 监听以允许 preventDefault({ passive: false })
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !visible) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.05 : 0.95;
      setScale((s) => Math.min(6, Math.max(0.2, s * factor)));
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative as EventListener);
  }, [visible]);

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    dragState.current.dragging = true;
    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;
    dragState.current.startPosX = position.x;
    dragState.current.startPosY = position.y;
  };

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPosition({ x: dragState.current.startPosX + dx, y: dragState.current.startPosY + dy });
  };

  const onMouseUpOrLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    dragState.current.dragging = false;
  };

  // 原生触摸事件（passive:false）
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !visible) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0];
        dragState.current.dragging = true;
        dragState.current.startX = t.clientX;
        dragState.current.startY = t.clientY;
        dragState.current.startPosX = position.x;
        dragState.current.startPosY = position.y;
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = [e.touches[0], e.touches[1]];
        dragState.current.pinchDist = Math.hypot(
          t1.clientX - t2.clientX,
          t1.clientY - t2.clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && dragState.current.dragging) {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - dragState.current.startX;
        const dy = t.clientY - dragState.current.startY;
        setPosition({ x: dragState.current.startPosX + dx, y: dragState.current.startPosY + dy });
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = [e.touches[0], e.touches[1]];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const prev = dragState.current.pinchDist || dist;
        const factor = dist / prev;
        setScale((s) => Math.min(6, Math.max(0.2, s * factor)));
        dragState.current.pinchDist = dist;
      }
    };

    const onTouchEnd = () => {
      dragState.current.dragging = false;
      dragState.current.pinchDist = undefined;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart as EventListener);
      el.removeEventListener('touchmove', onTouchMove as EventListener);
      el.removeEventListener('touchend', onTouchEnd as EventListener);
    };
  }, [visible, position.x, position.y]);

  const exportCropped = async () => {
    const imgEl = imgRef.current;
    if (!imgEl || !imageLoaded) return;
    const naturalW = imgEl.naturalWidth;
    const naturalH = imgEl.naturalHeight;
    const displayScale = baseScale * scale;

    // 画布为正方形输出
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = cropSize;
    canvas.height = cropSize;

    // 将裁剪框中心映射回原图坐标
    // position 是相对裁剪框中心的位移（px）
    const centerXOnImage = naturalW / 2 - (position.x / displayScale);
    const centerYOnImage = naturalH / 2 - (position.y / displayScale);

    const sx = centerXOnImage - (cropSize / 2) / displayScale;
    const sy = centerYOnImage - (cropSize / 2) / displayScale;
    const sWidth = cropSize / displayScale;
    const sHeight = cropSize / displayScale;

    // 边界处理：确保采样区域在原图范围内
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const sxClamped = clamp(sx, 0, naturalW);
    const syClamped = clamp(sy, 0, naturalH);
    const sWidthClamped = clamp(sWidth, 1, naturalW - sxClamped);
    const sHeightClamped = clamp(sHeight, 1, naturalH - syClamped);

    ctx?.clearRect(0, 0, cropSize, cropSize);
    ctx?.drawImage(
      imgEl,
      sxClamped,
      syClamped,
      sWidthClamped,
      sHeightClamped,
      0,
      0,
      cropSize,
      cropSize
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onConfirm(dataUrl);
  };

  if (!visible) return null;

  return (
    <div className="trimupload-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="trimupload-modal">
        <div className="trimupload-header">
          <h3>调整头像</h3>
          <button className="trimupload-close" onClick={onCancel}>×</button>
        </div>
        <div className="trimupload-body">
          <div
            ref={containerRef}
            className="trimupload-crop-area"
            style={{ width: cropSize + 2, height: cropSize + 2 }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUpOrLeave}
            onMouseLeave={onMouseUpOrLeave}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="crop"
              onLoad={(e) => {
                const img = e.currentTarget;
                const w = img.naturalWidth;
                const h = img.naturalHeight;
                setNaturalSize({ w, h });
                const shortSide = Math.min(w, h);
                const bs = cropSize / shortSide;
                setBaseScale(bs);
                setImageLoaded(true);
              }}
              className="trimupload-image"
              style={{ transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${baseScale * scale})` }}
              draggable={false}
            />
            <div className="trimupload-square-mask" />
            <div className="trimupload-circle-preview">
              <div className="trimupload-circle" />
            </div>
          </div>
          <div className="trimupload-tips">滚轮缩放，拖拽图片定位。导出为方形，列表中圆形显示。</div>
        </div>
        <div className="trimupload-footer">
          <button className="trimupload-btn" onClick={onCancel}>取消</button>
          <button className="trimupload-btn primary" onClick={exportCropped} disabled={!imageLoaded}>确定</button>
        </div>
      </div>
    </div>
  );
}


