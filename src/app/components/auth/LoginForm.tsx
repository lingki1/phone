'use client';

import { useState } from 'react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onSwitchToRegister: _onSwitchToRegister, onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 防止重复提交
    if (loading) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    // 基本验证
    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // 登录成功
        setSuccess('登录成功！');
        
        if (onLoginSuccess) {
          // 在有回调（模态内）时，不刷新页面，交由上层处理
          onLoginSuccess();
          setLoading(false);
        } else {
          // 独立页面场景保留跳转
          setTimeout(() => {
            window.location.href = '/';
          }, 800);
          setLoading(false);
        }
      } else {
        setError(data.message || '登录失败');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('网络错误，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && (
        <div className="auth-error">{error}</div>
      )}
      
      {success && (
        <div className="auth-success">{success}</div>
      )}

      <div className="auth-form-group">
        <label htmlFor="username" className="auth-label">
          用户名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="auth-input"
          placeholder="请输入用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="password" className="auth-label">
          密码
        </label>
        <div className="auth-password-toggle">
          <input
            id="password"
            name="password"
            type="password"
            required
            className="auth-input"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="auth-button"
      >
        {loading && <span className="auth-loading"></span>}
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
