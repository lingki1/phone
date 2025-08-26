'use client';

import { useState } from 'react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

export default function RegisterForm({ onSwitchToLogin: _onSwitchToLogin, onRegisterSuccess }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [activationCode, setActivationCode] = useState('');
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
    if (!username.trim()) {
      setError('请输入用户名');
      setLoading(false);
      return;
    }

    if (username.trim().length < 3 || username.trim().length > 20) {
      setError('用户名长度必须在3-20个字符之间');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('请输入密码');
      setLoading(false);
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      setError('密码长度不能少于6个字符');
      setLoading(false);
      return;
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim(), 
          email: email.trim() || undefined,
          activationCode: activationCode.trim() || undefined
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // 注册成功
        setSuccess('注册成功！正在跳转...');
        
        // 立即调用回调函数
        if (onRegisterSuccess) {
          onRegisterSuccess();
          // 即使有回调，也要跳转到首页
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
          setLoading(false);
        } else {
          // 如果没有回调，则延迟跳转让用户看到成功消息
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
          setLoading(false);
        }
      } else {
        setError(data.message || '注册失败');
        setLoading(false);
      }
    } catch (error) {
      console.error('Register error:', error);
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
          placeholder="请输入用户名 (3-20个字符)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={20}
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="activationCode" className="auth-label">
          激活码
        </label>
        <input
          id="activationCode"
          name="activationCode"
          type="text"
          className="auth-input"
          placeholder="请输入激活码（若管理员开启需要）"
          value={activationCode}
          onChange={(e) => setActivationCode(e.target.value)}
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="email" className="auth-label">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="auth-input"
          placeholder="请输入邮箱 (可选)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            placeholder="请输入密码 (至少6个字符)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
        </div>
      </div>

      <div className="auth-form-group">
        <label htmlFor="confirmPassword" className="auth-label">
          确认密码
        </label>
        <div className="auth-password-toggle">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="auth-input"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="auth-button"
      >
        {loading && <span className="auth-loading"></span>}
        {loading ? '注册中...' : '注册'}
      </button>
    </form>
  );
}
