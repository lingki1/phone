'use client';

import { useState } from 'react';
import { useI18n } from '../../components/i18n/I18nProvider';
import '../../auth/auth.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const { t } = useI18n();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');

    if (!oldPassword.trim()) {
      setError(t('Auth.changePwd.enterOld', '请输入旧密码'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('Auth.changePwd.newTooShort', '新密码长度不能少于6个字符'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(t('Auth.changePwd.mismatch', '两次输入的新密码不一致'));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldPassword, newPassword, confirmNewPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(t('Auth.changePwd.success', '密码修改成功'));
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        if (onSuccess) onSuccess();
        setTimeout(onClose, 800);
      } else {
        setError(data.message || t('Auth.changePwd.fail', '修改密码失败'));
      }
    } catch (err) {
      console.error('Change password error:', err);
      setError(t('Auth.common.networkError', '网络错误，请稍后重试'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <button 
            className="auth-modal-close" 
            onClick={onClose}
            title={t('Auth.modal.closeTitle', '关闭窗口')}
          >
            ×
          </button>
        </div>
        <div className="auth-modal-content">
          <div className="auth-header">
            <h1 className="auth-title">{t('Auth.changePwd.title', '修改密码')}</h1>
            <p className="auth-subtitle">{t('Auth.changePwd.subtitle', '请输入旧密码与新密码')}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="oldPassword" className="auth-label">{t('Auth.changePwd.old', '旧密码')}</label>
              <input
                id="oldPassword"
                name="oldPassword"
                type="password"
                className="auth-input"
                placeholder={t('Auth.changePwd.old.placeholder', '请输入旧密码')}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="newPassword" className="auth-label">{t('Auth.changePwd.new', '新密码')}</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className="auth-input"
                placeholder={t('Auth.changePwd.new.placeholder', '请输入新密码（至少6个字符）')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirmNewPassword" className="auth-label">{t('Auth.changePwd.confirm', '确认新密码')}</label>
              <input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                className="auth-input"
                placeholder={t('Auth.changePwd.confirm.placeholder', '请再次输入新密码')}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? t('Auth.changePwd.submitting', '提交中...') : t('Auth.changePwd.submit', '保存修改')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


