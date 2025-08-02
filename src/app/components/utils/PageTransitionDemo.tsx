'use client';

import React, { useState } from 'react';
import PageTransitionManager from './PageTransitionManager';

const DemoPage = ({ title, color, onBack }: { title: string; color: string; onBack: () => void }) => (
  <div style={{ 
    width: '100%', 
    height: '100vh', 
    backgroundColor: color, 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '2rem',
    fontWeight: 'bold'
  }}>
    <h1>{title}</h1>
    <button 
      onClick={onBack}
      style={{
        padding: '10px 20px',
        fontSize: '1rem',
        backgroundColor: 'rgba(255,255,255,0.2)',
        border: '2px solid white',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        marginTop: '20px'
      }}
    >
      返回
    </button>
  </div>
);

export default function PageTransitionDemo() {
  const [currentPage, setCurrentPage] = useState('home');

  const pages = [
    {
      id: 'home',
      component: (
        <div style={{ 
          width: '100%', 
          height: '100vh', 
          backgroundColor: '#1a73e8', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          <h1>页面切换动画演示</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={() => setCurrentPage('page1')}
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '2px solid white',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              淡入淡出效果
            </button>
            <button 
              onClick={() => setCurrentPage('page2')}
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '2px solid white',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              滑动效果
            </button>
            <button 
              onClick={() => setCurrentPage('page3')}
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '2px solid white',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              缩放效果
            </button>
            <button 
              onClick={() => setCurrentPage('page4')}
              style={{
                padding: '10px 20px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '2px solid white',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              弹性效果
            </button>
          </div>
        </div>
      ),
      direction: 'fade' as const,
      duration: 400
    },
    {
      id: 'page1',
      component: <DemoPage title="淡入淡出效果" color="#e91e63" onBack={() => setCurrentPage('home')} />,
      direction: 'fade' as const,
      duration: 400
    },
    {
      id: 'page2',
      component: <DemoPage title="滑动效果" color="#4caf50" onBack={() => setCurrentPage('home')} />,
      direction: 'left' as const,
      duration: 350
    },
    {
      id: 'page3',
      component: <DemoPage title="缩放效果" color="#ff9800" onBack={() => setCurrentPage('home')} />,
      direction: 'scale' as const,
      duration: 300
    },
    {
      id: 'page4',
      component: <DemoPage title="弹性效果" color="#9c27b0" onBack={() => setCurrentPage('home')} />,
      direction: 'scale' as const,
      duration: 500
    }
  ];

  return (
    <PageTransitionManager
      pages={pages}
      currentPageId={currentPage}
      defaultDirection="left"
      defaultDuration={350}
    />
  );
} 