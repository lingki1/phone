'use client';

import { useEffect } from 'react';
import { useCurrentTheme } from '../../hooks/useTheme';
import { getThemePrimaryColor } from '../../utils/themeUtils';

/**
 * 主题元数据更新器
 * 负责更新浏览器的主题色和其他元数据
 */
export default function ThemeMetaUpdater() {
  const { currentTheme } = useCurrentTheme();

  useEffect(() => {
    // 更新主题色
    const themeColor = getThemePrimaryColor(currentTheme);
    
    // 更新viewport meta标签的theme-color
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', themeColor);

    // 更新msapplication-TileColor
    const tileMeta = document.querySelector('meta[name="msapplication-TileColor"]');
    if (tileMeta) {
      tileMeta.setAttribute('content', themeColor);
    }

    // 更新苹果设备的状态栏样式
    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarMeta) {
      // 根据主题决定状态栏样式
      const isDark = ['dark', 'masculine'].includes(currentTheme);
      statusBarMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');
    }

    // 更新favicon（如果需要）
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      // 可以根据主题切换不同的favicon
      // favicon.href = `/favicon-${currentTheme}.ico`;
    }

    console.log(`Theme meta updated for theme: ${currentTheme}, color: ${themeColor}`);
  }, [currentTheme]);

  // 这个组件不渲染任何内容
  return null;
}

/**
 * 主题色提取器
 * 用于在服务端渲染时获取默认主题色
 */
export function getDefaultThemeColor(): string {
  return getThemePrimaryColor('default');
}