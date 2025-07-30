'use client';

/**
 * 主题初始化脚本
 * 在页面加载时立即执行，避免主题切换时的闪烁
 */
export default function ThemeInitScript() {
  const script = `
    (function() {
      try {
        // 从localStorage获取保存的主题
        const STORAGE_KEY = 'user-theme-settings';
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const themeId = settings.selectedTheme;
          
          // 主题类名映射
          const themeClassMap = {
            'dark': 'theme-dark',
            'masculine': 'theme-masculine',
            'feminine': 'theme-feminine',
            'anime': 'theme-anime',
            'cute': 'theme-cute',
            'metal': 'theme-metal',
            'forest': 'theme-forest',
            'ocean': 'theme-ocean',
            'sunset': 'theme-sunset',
            'minimal': 'theme-minimal'
          };
          
          // 应用主题类
          if (themeId && themeId !== 'default' && themeClassMap[themeId]) {
            document.body.classList.add(themeClassMap[themeId]);
          } else {
            // 即使是默认主题，也添加一个标记类
            document.body.classList.add('theme-initialized');
          }
          
          console.log('Theme pre-loaded:', themeId);
        }
      } catch (error) {
        console.warn('Failed to pre-load theme:', error);
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}