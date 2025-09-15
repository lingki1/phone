'use client';

import React from 'react';
import './LocaleSwitcher.css';
import { useI18n } from './I18nProvider';

const supportedLocales: Array<{ code: 'zh-CN' | 'en'; label: string; short: string }> = [
  { code: 'zh-CN', label: '中文', short: '中' },
  { code: 'en', label: 'English', short: 'EN' }
];

export default function LocaleSwitcher({ compact: _compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();

  return (
    <div className={`locale-switcher-wrapper${_compact ? ' compact' : ''}`}>
      <select
        className={`locale-switcher-select${_compact ? ' compact' : ''}`}
        value={locale}
        onChange={(e) => setLocale(e.target.value as 'zh-CN' | 'en')}
        aria-label="language switcher"
      >
        {supportedLocales.map((item) => (
          <option key={item.code} value={item.code}>
            {_compact ? item.short : item.label}
          </option>
        ))}
      </select>
      <span className={`locale-switcher-caret${_compact ? ' compact' : ''}`}>▾</span>
    </div>
  );
}


