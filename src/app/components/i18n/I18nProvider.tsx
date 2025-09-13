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
  const segments = path.split('.');
  let current: Primitive | MessageMap | undefined = obj;
  let index = 0;

  while (index < segments.length) {
    const segment = segments[index];

    // 优先：正常的分层键
    if (current && typeof current === 'object' && segment in (current as MessageMap)) {
      current = (current as MessageMap)[segment];
      index += 1;
      continue;
    }

    // 兼容：同层存在扁平化的点号键（如 "ChatInterface.StoryToggle" 或 "QQ.StoryMode.MemorySync"）
    if (current && typeof current === 'object') {
      const currentObj = current as MessageMap;
      let matchedCombinedKey: string | undefined;

      for (const key of Object.keys(currentObj)) {
        if (!key.startsWith(segment + '.')) continue;
        const keyParts = key.split('.');

        // 检查该扁平化键是否恰好匹配接下来的若干段
        let isFullMatch = true;
        for (let j = 0; j < keyParts.length; j++) {
          if (segments[index + j] !== keyParts[j]) {
            isFullMatch = false;
            break;
          }
        }
        if (isFullMatch) {
          matchedCombinedKey = key;
          // 消费掉匹配到的各个分段
          index += keyParts.length;
          current = currentObj[key];
          break;
        }
      }

      if (matchedCombinedKey) {
        continue;
      }
    }

    // 未命中
    return undefined;
  }

  return current;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  function normalizeLocale(input: string | null | undefined): SupportedLocale {
    if (!input) return 'zh-CN';
    if (input === 'en' || input === 'zh-CN') return input;
    const lower = String(input).toLowerCase();
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('zh')) return 'zh-CN';
    return 'zh-CN';
  }

  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window === 'undefined') return 'zh-CN';
    const saved = window.localStorage.getItem(I18N_STORAGE_KEY);
    return normalizeLocale(saved);
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


