'use client';

/**
 * Theme switching state manager
 * Manages various states during theme switching process
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
   * Get current state
   */
  public getState(): ThemeState {
    return { ...this.state };
  }

  /**
   * Update state
   */
  public setState(updates: Partial<ThemeState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: (state: ThemeState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
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
   * Start theme switching
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
   * Complete theme switching
   */
  public completeThemeChange(): void {
    this.setState({
      isLoading: false,
      isTransitioning: false,
      error: null
    });
  }

  /**
   * Theme switching failed
   */
  public failThemeChange(error: string): void {
    this.setState({
      isLoading: false,
      isTransitioning: false,
      error
    });
  }

  /**
   * Start preview mode
   */
  public startPreview(themeId: string): void {
    this.setState({
      isPreviewMode: true,
      previewThemeId: themeId
    });
  }

  /**
   * End preview mode
   */
  public endPreview(): void {
    this.setState({
      isPreviewMode: false,
      previewThemeId: null
    });
  }

  /**
   * Clear error
   */
  public clearError(): void {
    this.setState({
      error: null
    });
  }

  /**
   * Reset state
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

// Export singleton instance
export const themeStateManager = ThemeStateManager.getInstance();