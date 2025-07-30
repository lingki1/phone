'use client';

/**
 * 主题切换状态管理器
 * 管理主题切换过程中的各种状态
 */

export interface ThemeState {
  isLoading: boolean;
  isPreviewMode: boolean;
  previewThemeId: string | null;
  lastAppliedTheme: string;
  isTransitioning: boolean;
  error: string | null;
}

export class ThemeStateManager {
  private static instance: ThemeStateManager;
  private state: ThemeState = {
    isLoading: false,
    isPreviewMode: false,
    previewThemeId: null,
    lastAppliedTheme: 'default',
    isTransitioning: false,
    error: null
  };
  private listeners: Set<(state: ThemeState) => void> = new Set();

  private constructor() {}

  public static getInstance(): ThemeStateManager {
    if (!ThemeStateManager.instance) {
      ThemeStateManager.instance = new ThemeStateManager();
    }
    return ThemeStateManager.instance;
  }

  /**
   * 获取当前状态
   */
  public getState(): ThemeState {
    return { ...this.state };
  }

  /**
   * 更新状态
   */
  public setState(updates: Partial<ThemeState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  /**
   * 订阅状态变化
   */
  public subscribe(listener: (state: ThemeState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in theme state listener:', error);
      }
    });
  }

  /**
   * 开始主题切换
   */
  public startThemeChange(themeId: string): void {
    this.setState({
      isLoading: true,
      isTransitioning: true,
      error: null,
      lastAppliedTheme: themeId
    });
  }

  /**
   * 完成主题切换
   */
  public completeThemeChange(): void {
    this.setState({
      isLoading: false,
      isTransitioning: false,
      error: null
    });
  }

  /**
   * 主题切换失败
   */
  public failThemeChange(error: string): void {
    this.setState({
      isLoading: false,
      isTransitioning: false,
      error
    });
  }

  /**
   * 开始预览模式
   */
  public startPreview(themeId: string): void {
    this.setState({
      isPreviewMode: true,
      previewThemeId: themeId
    });
  }

  /**
   * 结束预览模式
   */
  public endPreview(): void {
    this.setState({
      isPreviewMode: false,
      previewThemeId: null
    });
  }

  /**
   * 清除错误
   */
  public clearError(): void {
    this.setState({
      error: null
    });
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.state = {
      isLoading: false,
      isPreviewMode: false,
      previewThemeId: null,
      lastAppliedTheme: 'default',
      isTransitioning: false,
      error: null
    };
    this.notifyListeners();
  }
}

// 导出单例实例
export const themeStateManager = ThemeStateManager.getInstance();