'use client';

import { Theme, ThemeVariables } from '../types/theme';

/**
 * 主题工具函数集合
 */

/**
 * 检查浏览器是否支持CSS变量
 */
export function isCSSVariablesSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--fake-var)');
}

/**
 * 获取CSS变量的值
 */
export function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

/**
 * 设置CSS变量的值
 */
export function setCSSVariable(variableName: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(variableName, value);
}

/**
 * 批量设置CSS变量
 */
export function setCSSVariables(variables: Partial<ThemeVariables>): void {
  if (typeof window === 'undefined') return;
  
  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      document.documentElement.style.setProperty(key, value);
    }
  });
}

/**
 * 移除CSS变量
 */
export function removeCSSVariable(variableName: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.removeProperty(variableName);
}

/**
 * 获取主题的对比度比例
 */
export function getContrastRatio(color1: string, color2: string): number {
  // 简化的对比度计算，实际项目中可能需要更精确的算法
  const getLuminance = (color: string): number => {
    // 移除#号并转换为RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // 计算相对亮度
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * 检查主题是否符合可访问性标准
 */
export function isThemeAccessible(theme: Theme): boolean {
  const { primary, secondary, accent } = theme.preview;
  
  // 检查主要颜色组合的对比度
  const primarySecondaryRatio = getContrastRatio(primary, secondary);
  const primaryAccentRatio = getContrastRatio(primary, accent);
  const secondaryAccentRatio = getContrastRatio(secondary, accent);
  
  // WCAG AA标准要求对比度至少为4.5:1
  const minRatio = 4.5;
  
  return primarySecondaryRatio >= minRatio || 
         primaryAccentRatio >= minRatio || 
         secondaryAccentRatio >= minRatio;
}

/**
 * 生成主题预览样式
 */
export function generateThemePreviewStyle(theme: Theme): React.CSSProperties {
  const { primary, secondary, accent, gradient } = theme.preview;
  
  return {
    backgroundColor: primary,
    color: getContrastRatio(primary, '#000000') > getContrastRatio(primary, '#ffffff') ? '#000000' : '#ffffff',
    border: `2px solid ${secondary}`,
    boxShadow: `0 2px 8px ${accent}33`, // 33 为20%透明度的十六进制
    background: gradient || primary,
  };
}

/**
 * 获取主题的主色调
 */
export function getThemePrimaryColor(themeId: string): string {
  const themeColorMap: Record<string, string> = {
    'default': '#007bff',
    'dark': '#4dabf7',
    'masculine': '#00d4ff',
    'feminine': '#f472b6',
    'anime': '#c084fc',
    'cute': '#ff8c42',
    'metal': '#475569',
    'forest': '#16a34a',
    'ocean': '#0891b2',
    'sunset': '#f59e0b',
    'minimal': '#000000'
  };
  
  return themeColorMap[themeId] || themeColorMap['default'];
}

/**
 * 判断主题是否为深色主题
 */
export function isDarkTheme(theme: Theme): boolean {
  const darkThemes = ['dark', 'masculine'];
  return darkThemes.includes(theme.id);
}

/**
 * 获取主题的CSS类名
 */
export function getThemeClassName(themeId: string): string {
  if (themeId === 'default') return '';
  return `theme-${themeId}`;
}

/**
 * 创建主题切换的CSS过渡效果
 */
export function createThemeTransition(duration: number = 300): string {
  return `background-color ${duration}ms ease-in-out, color ${duration}ms ease-in-out, border-color ${duration}ms ease-in-out, box-shadow ${duration}ms ease-in-out`;
}

/**
 * 检查用户是否偏好减少动画
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 应用主题过渡效果
 */
export function applyThemeTransition(element: HTMLElement, duration?: number): void {
  if (prefersReducedMotion()) return;
  
  const transition = createThemeTransition(duration);
  element.style.transition = transition;
  
  // 在过渡完成后移除过渡样式，避免影响其他动画
  setTimeout(() => {
    element.style.transition = '';
  }, duration || 300);
}

/**
 * 获取系统偏好的颜色方案
 */
export function getSystemColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 根据系统偏好推荐主题
 */
export function getRecommendedTheme(): string {
  const systemScheme = getSystemColorScheme();
  return systemScheme === 'dark' ? 'dark' : 'default';
}

/**
 * 验证主题ID是否有效
 */
export function isValidThemeId(themeId: string, availableThemes: Theme[]): boolean {
  return availableThemes.some(theme => theme.id === themeId);
}

/**
 * 获取主题的友好显示名称
 */
export function getThemeDisplayName(themeId: string, availableThemes: Theme[]): string {
  const theme = availableThemes.find(t => t.id === themeId);
  return theme?.name || '未知主题';
}

/**
 * 生成主题的唯一标识符
 */
export function generateThemeHash(theme: Theme): string {
  const data = JSON.stringify({
    id: theme.id,
    className: theme.className,
    preview: theme.preview
  });
  
  // 简单的哈希函数
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return Math.abs(hash).toString(36);
}