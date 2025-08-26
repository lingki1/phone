'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import '../../auth/auth.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const _router = useRouter();

  if (!isOpen) return null;

  const handleLoginSuccess = () => {
    onLoginSuccess();
    onClose();
  };

  const handleRegisterSuccess = () => {
    onLoginSuccess();
    onClose();
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <button 
            className="auth-modal-close" 
            onClick={onClose}
            title="关闭登录窗口（可查看公告）"
          >
            ×
          </button>
        </div>
        
        <div className="auth-modal-content">
          <div className="auth-header">
            <h1 className="auth-title">
              {isLogin ? 'Lingki-傻瓜机' : '创建账户'}
            </h1>
            <p className="auth-subtitle">
              {isLogin ? '请登录您的账户' : '请填写以下信息创建账户'}
            </p>
          </div>
          
          {isLogin ? (
            <LoginForm 
              onSwitchToRegister={() => setIsLogin(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          ) : (
            <RegisterForm 
              onSwitchToLogin={() => setIsLogin(true)}
              onRegisterSuccess={handleRegisterSuccess}
            />
          )}
          
          <div className="auth-switch">
            <span className="auth-switch-text">
              {isLogin ? '没有账户？' : '已有账户？'}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="auth-switch-link"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
