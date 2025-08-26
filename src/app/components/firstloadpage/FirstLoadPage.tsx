'use client';

import { useEffect, useState } from 'react';
import './FirstLoadPage.css';

interface FirstLoadPageProps {
  message?: string;
  subMessage?: string;
}

export default function FirstLoadPage({ 
  message = "检查登录状态...", 
  subMessage = "如果长时间无响应，请刷新页面" 
}: FirstLoadPageProps) {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  // 动态显示加载点
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // 模拟进度条
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="first-load-page">
      {/* 背景动画 */}
      <div className="background-animation">
        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>
        <div className="floating-circle circle-4"></div>
      </div>

      {/* 主要内容 */}
      <div className="load-content">
        {/* Logo区域 */}
        <div className="logo-section">
          <div className="logo-icon">
            <div className="logo-inner">
              <span className="logo-text">L</span>
            </div>
          </div>
          <h1 className="app-title">Lingki-傻瓜机</h1>
        </div>

        {/* 加载动画 */}
        <div className="loading-section">
          <div className="spinner-container">
            <div className="spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
          </div>
          
          {/* 进度条 */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">{Math.round(progress)}%</div>
          </div>

          {/* 加载文字 */}
          <div className="loading-text">
            <div className="main-message">{message}{dots}</div>
            <div className="sub-message">{subMessage}</div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="footer-hint">
          <div className="hint-icon">💡</div>
          <div className="hint-text">正在为您准备最佳体验</div>
        </div>
      </div>
    </div>
  );
}
