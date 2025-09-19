'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../../components/i18n/I18nProvider';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

export default function RegisterForm({ onSwitchToLogin: _onSwitchToLogin, onRegisterSuccess }: RegisterFormProps) {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requireActivation, setRequireActivation] = useState(false);
  const [purchaseUrl1, setPurchaseUrl1] = useState('');
  const [purchaseUrl2, setPurchaseUrl2] = useState('');

  useEffect(() => {
    const loadPublicSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data?.success) {
          setRequireActivation(Boolean(data.settings?.register_require_activation));
          setPurchaseUrl1(String(data.settings?.purchase_url_1 || '').trim());
          setPurchaseUrl2(String(data.settings?.purchase_url_2 || '').trim());
        }
      } catch (_e) {
        // ignore
      }
    };
    loadPublicSettings();
  }, []);

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
      setError(t('Auth.register.enterUsername', '请输入用户名'));
      setLoading(false);
      return;
    }

    if (username.trim().length < 3 || username.trim().length > 20) {
      setError(t('Auth.register.usernameLength', '用户名长度必须在3-20个字符之间'));
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError(t('Auth.register.enterPassword', '请输入密码'));
      setLoading(false);
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      setError(t('Auth.register.passwordLength', '密码长度不能少于6个字符'));
      setLoading(false);
      return;
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      setError(t('Auth.register.passwordMismatch', '两次输入的密码不一致'));
      setLoading(false);
      return;
    }

    // 验证邮箱必填与基本格式
    if (!email.trim()) {
      setError(t('Auth.register.enterEmail', '请输入邮箱'));
      setLoading(false);
      return;
    }
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(email.trim())) {
      setError(t('Auth.register.emailInvalid', '邮箱格式不正确'));
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
          email: email.trim(),
          activationCode: activationCode.trim() || undefined
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // 注册成功
        setSuccess(t('Auth.register.success', '注册成功！正在跳转...'));
        
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
        setError(data.message || t('Auth.register.fail', '注册失败'));
        setLoading(false);
      }
    } catch (error) {
      console.error('Register error:', error);
      setError(t('Auth.common.networkError', '网络错误，请稍后重试'));
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
          {t('Auth.common.username', '用户名')}
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="auth-input"
          placeholder={t('Auth.placeholder.usernameWithRule', '请输入用户名 (3-20个字符)')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={20}
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="activationCode" className="auth-label">
          {t('Auth.register.activationCode', '激活码')}
        </label>
        <input
          id="activationCode"
          name="activationCode"
          type="text"
          className="auth-input"
          placeholder={t('Auth.placeholder.activationCode', '请输入激活码（若管理员开启需要）')}
          value={activationCode}
          onChange={(e) => setActivationCode(e.target.value)}
        />
        {requireActivation && ((purchaseUrl1 && purchaseUrl1.trim()) || (purchaseUrl2 && purchaseUrl2.trim())) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {purchaseUrl1 && purchaseUrl1.trim() && (
              <a
                href={purchaseUrl1}
                target="_blank"
                rel="noopener noreferrer"
                className="auth-button"
                style={{ padding: '6px 10px', fontSize: 12, lineHeight: '20px' }}
              >
                {t('Auth.register.buyCardCn', '中国用户购卡')}
              </a>
            )}
            {purchaseUrl2 && purchaseUrl2.trim() && (
              <a
                href={purchaseUrl2}
                target="_blank"
                rel="noopener noreferrer"
                className="auth-button"
                style={{ padding: '6px 10px', fontSize: 12, lineHeight: '20px' }}
              >
                {t('Auth.register.buyCardIntl', '国际用户购卡')}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="auth-form-group">
        <label htmlFor="email" className="auth-label">
          {t('Auth.common.email', '邮箱')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="auth-input"
          placeholder={t('Auth.placeholder.emailRequired', 'Enter email (required)')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="password" className="auth-label">
          {t('Auth.common.password', '密码')}
        </label>
        <div className="auth-password-toggle">
          <input
            id="password"
            name="password"
            type="password"
            required
            className="auth-input"
            placeholder={t('Auth.placeholder.passwordWithRule', '请输入密码 (至少6个字符)')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
        </div>
      </div>

      <div className="auth-form-group">
        <label htmlFor="confirmPassword" className="auth-label">
          {t('Auth.register.confirmPassword', '确认密码')}
        </label>
        <div className="auth-password-toggle">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="auth-input"
            placeholder={t('Auth.placeholder.confirmPassword', '请再次输入密码')}
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
        {loading ? t('Auth.register.submitting', '注册中...') : t('Auth.register.submit', '注册')}
      </button>
    </form>
  );
}
