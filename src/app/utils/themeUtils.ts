'use client';

import { Theme, ThemeVariables } from '../types/theme';

/**
 * Theme utility functions collection
 */

/**
 * Check if browser supports CSS variables
 */
export function isCSSVariablesSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--fake-var)');
}

/**
 * Get CSS variable value
 */
export function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

/**
 * Set CSS variable value
 */
export function setCSSVariable(variableName: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(variableName, value);
}

/**
 * Batch set CSS variables
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
 * Remove CSS variable
 */
export function removeCSSVariable(variableName: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.removeProperty(variableName);
}

/**
 * Get theme contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast calculation, may need more precise algorithm in actual projects
  const getLuminance = (color: string): number => {
    // Remove # and convert to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Calculate relative luminance
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
 * Check if theme meets accessibility standards
 */
export function isThemeAccessible(theme: Theme): boolean {
  const { primary, secondary, accent } = theme.preview;
  
  // Check contrast of main color combinations
  const primarySecondaryRatio = getContrastRatio(primary, secondary);
  const primaryAccentRatio = getContrastRatio(primary, accent);
  const secondaryAccentRatio = getContrastRatio(secondary, accent);
  
  // WCAG AA standard requires contrast ratio of at least 4.5:1
  const minRatio = 4.5;
  
  return primarySecondaryRatio >= minRatio || 
         primaryAccentRatio >= minRatio || 
         secondaryAccentRatio >= minRatio;
}

/**
 * Generate theme preview style
 */
export function generateThemePreviewStyle(theme: Theme): React.CSSProperties {
  const { primary, secondary, accent, gradient } = theme.preview;
  
  return {
    backgroundColor: primary,
    color: getContrastRatio(primary, '#000000') > getContrastRatio(primary, '#ffffff') ? '#000000' : '#ffffff',
    border: `2px solid ${secondary}`,
    boxShadow: `0 2px 8px ${accent}33`, // 33 is 20% opacity in hexadecimal
    background: gradient || primary,
  };
}

/**
 * Get theme primary color
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
 * Determine if theme is dark theme
 */
export function isDarkTheme(theme: Theme): boolean {
  const darkThemes = ['dark', 'masculine'];
  return darkThemes.includes(theme.id);
}

/**
 * Get theme CSS class name
 */
export function getThemeClassName(themeId: string): string {
  if (themeId === 'default') return '';
  return `theme-${themeId}`;
}

/**
 * Create CSS transition effect for theme switching
 */
export function createThemeTransition(duration: number = 300): string {
  return `background-color ${duration}ms ease-in-out, color ${duration}ms ease-in-out, border-color ${duration}ms ease-in-out, box-shadow ${duration}ms ease-in-out`;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply theme transition effect
 */
export function applyThemeTransition(element: HTMLElement, duration?: number): void {
  if (prefersReducedMotion()) return;
  
  const transition = createThemeTransition(duration);
  element.style.transition = transition;
  
  // Remove transition style after completion to avoid affecting other animations
  setTimeout(() => {
    element.style.transition = '';
  }, duration || 300);
}

/**
 * Get system preferred color scheme
 */
export function getSystemColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Recommend theme based on system preference
 */
export function getRecommendedTheme(): string {
  const systemScheme = getSystemColorScheme();
  return systemScheme === 'dark' ? 'dark' : 'default';
}

/**
 * Validate if theme ID is valid
 */
export function isValidThemeId(themeId: string, availableThemes: Theme[]): boolean {
  return availableThemes.some(theme => theme.id === themeId);
}

/**
 * Get theme friendly display name
 */
export function getThemeDisplayName(themeId: string, availableThemes: Theme[]): string {
  const theme = availableThemes.find(t => t.id === themeId);
  return theme?.name || 'Unknown Theme';
}

/**
 * Generate unique identifier for theme
 */
export function generateThemeHash(theme: Theme): string {
  const data = JSON.stringify({
    id: theme.id,
    className: theme.className,
    preview: theme.preview
  });
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}