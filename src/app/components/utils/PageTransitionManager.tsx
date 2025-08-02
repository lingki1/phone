'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import PageTransition from './PageTransition';

export type TransitionDirection = 'left' | 'right' | 'up' | 'down' | 'fade' | 'scale' | 'slide-fade-left' | 'slide-fade-right' | 'slide-fade-up' | 'slide-fade-down' | 'bounce' | 'flip' | '3d-left' | '3d-right';

interface PageConfig {
  id: string;
  component: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down' | 'fade' | 'scale';
  duration?: number;
}

interface PageTransitionManagerProps {
  pages: PageConfig[];
  currentPageId: string;
  onPageChange?: (pageId: string) => void;
  defaultDirection?: 'left' | 'right' | 'up' | 'down' | 'fade' | 'scale';
  defaultDuration?: number;
}

export default function PageTransitionManager({
  pages,
  currentPageId,
  onPageChange,
  defaultDuration = 300
}: PageTransitionManagerProps) {
  const [currentPage, setCurrentPage] = useState(currentPageId);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (currentPageId !== currentPage && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentPage(currentPageId);
    }
  }, [currentPageId, currentPage, isTransitioning]);

  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    onPageChange?.(currentPage);
  };

  // const getPageConfig = (pageId: string) => {
  //   return pages.find(page => page.id === pageId);
  // };

  const getTransitionDirection = (fromPageId: string, toPageId: string): 'left' | 'right' | 'up' | 'down' | 'fade' | 'scale' => {
    const fromIndex = pages.findIndex(page => page.id === fromPageId);
    const toIndex = pages.findIndex(page => page.id === toPageId);
    
    if (fromIndex === -1 || toIndex === -1) return 'fade';
    
    // 根据页面索引关系决定动画方向
    if (toIndex > fromIndex) {
      return 'left'; // 前进
    } else if (toIndex < fromIndex) {
      return 'right'; // 后退
    }
    
    return 'fade';
  };

  return (
    <div className="page-transition-manager" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {pages.map((page) => {
        const isVisible = page.id === currentPage;
        const direction = page.direction || getTransitionDirection(currentPage, page.id);
        const duration = page.duration || defaultDuration;

        return (
          <PageTransition
            key={page.id}
            isVisible={isVisible}
            direction={direction}
            duration={duration}
            onTransitionEnd={handleTransitionEnd}
          >
            {page.component}
          </PageTransition>
        );
      })}
    </div>
  );
}

// 便捷的页面切换Hook
export function usePageTransition(initialPageId: string) {
  const [currentPageId, setCurrentPageId] = useState(initialPageId);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateTo = (pageId: string, callback?: () => void) => {
    if (currentPageId === pageId || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentPageId(pageId);
    
    // 等待动画完成
    setTimeout(() => {
      setIsTransitioning(false);
      callback?.();
    }, 300);
  };

  return {
    currentPageId,
    isTransitioning,
    navigateTo
  };
} 