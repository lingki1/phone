'use client';

import React from 'react';
import './LocaleSwitcher.css';
import { useI18n } from './I18nProvider';

const supportedLocales: Array<{ code: 'zh-CN' | 'en'; label: string }> = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en', label: 'English' }
];

export default function LocaleSwitcher({ compact: _compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();

  return (
    <div className="locale-switcher-wrapper">
      <select
        className="locale-switcher-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as 'zh-CN' | 'en')}
        aria-label="language switcher"
      >
        {supportedLocales.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      <span className="locale-switcher-caret">▾</span>
    </div>
  );
}


