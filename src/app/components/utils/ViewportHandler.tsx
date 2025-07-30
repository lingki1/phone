'use client';

import { useEffect } from 'react';

/**
 * 视口处理器组件
 * 专门解决移动端浏览器（特别是 Chrome）地址栏显示/隐藏导致的视口高度问题
 */
export default function ViewportHandler() {
  useEffect(() => {
    // 设置视口高度的 CSS 变量
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      const dvh = window.innerHeight * 0.01;
      const svh = window.innerHeight * 0.01;
      
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      document.documentElement.style.setProperty('--dvh', `${dvh}px`);
      document.documentElement.style.setProperty('--svh', `${svh}px`);
      
      // 设置实际视口高度
      document.documentElement.style.setProperty('--actual-vh', `${window.innerHeight}px`);
    };

    // 初始化设置
    setViewportHeight();

    // 监听窗口大小变化
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    // 监听 Chrome 移动端的地址栏变化
    let lastHeight = window.innerHeight;
    const checkHeight = () => {
      const currentHeight = window.innerHeight;
      if (currentHeight !== lastHeight) {
        lastHeight = currentHeight;
        setViewportHeight();
      }
    };

    // 使用 requestAnimationFrame 来检测高度变化
    let rafId: number;
    const observeHeight = () => {
      checkHeight();
      rafId = requestAnimationFrame(observeHeight);
    };
    rafId = requestAnimationFrame(observeHeight);

    // 清理函数
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // 这个组件不渲染任何内容
  return null;
}

/**
 * 获取当前视口高度的工具函数
 */
export function getViewportHeight(): number {
  return window.innerHeight;
}

/**
 * 设置视口高度的工具函数
 */
export function setViewportHeight(): void {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--actual-vh', `${window.innerHeight}px`);
} 