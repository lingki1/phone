// 主题相关的类型定义

export interface Theme {
  id: string;
  name: string;
  description: string;
  className: string;
  category: 'basic' | 'gender' | 'style' | 'nature' | 'custom';
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    gradient?: string;
  };
  isCustom?: boolean;
  customColors?: CustomThemeColors;
}

// 自定义主题颜色配置
export interface CustomThemeColors {
  // 背景色
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  
  // 文本色
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // 强调色
  accentColor: string;
  accentHover: string;
  
  // 边框色
  borderColor: string;
  borderLight: string;
  
  // 阴影
  shadowLight: string;
  shadowMedium: string;
  shadowHeavy: string;
  
  // 气泡样式
  bubbleStyle: {
    userBubble: {
      bg: string;
      text: string;
      borderRadius: string;
    };
    aiBubble: {
      bg: string;
      text: string;
      borderRadius: string;
    };
  };
  
  // 特殊元素
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
}

export interface UserThemeSettings {
  selectedTheme: string;
  lastUpdated: number;
  customThemes?: Theme[];
}

export interface ThemeCategory {
  id: string;
  name: string;
}

export interface ThemePreviewProps {
  theme: Theme;
  isSelected: boolean;
  isPreview: boolean;
  onSelect: (themeId: string) => void;
  onPreview: (themeId: string) => void;
  onPreviewEnd?: () => void;
}

export interface ColorSettingsPageProps {
  onBack: () => void;
}

export interface ColorSettingsPageState {
  selectedTheme: string;
  previewTheme: string | null;
  isLoading: boolean;
  categories: ThemeCategory[];
}

// 主题事件类型
export interface ThemeChangeEvent extends CustomEvent {
  detail: {
    themeId: string;
    previousThemeId?: string;
  };
}

// 主题管理器接口
export interface IThemeManager {
  getAvailableThemes(): Theme[];
  getThemesByCategory(category: string): Theme[];
  getCurrentTheme(): string;
  getThemeById(id: string): Theme | undefined;
  setTheme(themeId: string): Promise<void>;
  loadSavedTheme(): Promise<void>;
  previewTheme(themeId: string): void;
  cancelPreview(): void;
  isCSSVariablesSupported(): boolean;
  getCategories(): ThemeCategory[];
}

// CSS变量映射
export interface ThemeVariables {
  '--theme-bg-primary': string;
  '--theme-bg-secondary': string;
  '--theme-bg-tertiary': string;
  '--theme-text-primary': string;
  '--theme-text-secondary': string;
  '--theme-text-tertiary': string;
  '--theme-accent-color': string;
  '--theme-accent-hover': string;
  '--theme-border-color': string;
  '--theme-border-light': string;
  '--theme-shadow-light': string;
  '--theme-shadow-medium': string;
  '--theme-shadow-heavy': string;
  '--theme-message-user-bg': string;
  '--theme-message-ai-bg': string;
  '--theme-message-user-text': string;
  '--theme-message-ai-text': string;
  '--theme-header-bg': string;
  '--theme-nav-bg': string;
  '--theme-nav-active': string;
}

// 主题配置
export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  className: string;
  variables: Partial<ThemeVariables>;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    gradient?: string;
  };
}