'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SupportedLocale = 'zh-CN' | 'en';

type Primitive = string | number | boolean | null | undefined;
interface MessageMap {
  [key: string]: Primitive | MessageMap;
}

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (path: string, fallback?: string) => string;
}

const I18N_STORAGE_KEY = 'app-locale';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getByPath(obj: MessageMap, path: string): Primitive | MessageMap | undefined {
  const keys = path.split('.');
  let current: Primitive | MessageMap | undefined = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as MessageMap)) {
      current = (current as MessageMap)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window === 'undefined') return 'zh-CN';
    const saved = window.localStorage.getItem(I18N_STORAGE_KEY) as SupportedLocale | null;
    return saved || 'zh-CN';
  });

  const [messages, setMessages] = useState<MessageMap>({});

  useEffect(() => {
    let active = true;
    async function loadMessages() {
      try {
        const mod = await import(`../../../messages/${locale}.json`);
        if (!active) return;
        setMessages(mod.default || mod);
      } catch (_e) {
        setMessages({});
      }
    }
    loadMessages();
    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = (next: SupportedLocale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(I18N_STORAGE_KEY, next);
    }
  };

  const t = useMemo(() => {
    return (path: string, fallback?: string) => {
      const val = getByPath(messages, path);
      if (val === undefined || val === null) return fallback ?? path;
      if (typeof val === 'string') return val;
      try {
        return String(val);
      } catch {
        return fallback ?? path;
      }
    };
  }, [messages]);

  const value: I18nContextValue = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


