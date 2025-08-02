'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import './PageTransition.css';

interface PageTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  direction?: 'left' | 'right' | 'up' | 'down' | 'fade' | 'scale';
  duration?: number;
  onTransitionEnd?: () => void;
}

export default function PageTransition({ 
  children, 
  isVisible, 
  direction = 'fade', 
  duration = 300,
  onTransitionEnd 
}: PageTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleTransitionEnd = () => {
    setIsAnimating(false);
    onTransitionEnd?.();
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`page-transition page-transition-${direction} ${isVisible ? 'visible' : ''} ${isAnimating ? 'animating' : ''}`}
      style={{ '--transition-duration': `${duration}ms` } as React.CSSProperties}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
} 