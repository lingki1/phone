'use client';

/**
 * 主题性能优化工具
 */

// 防抖函数
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 节流函数
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 主题切换性能监控器
 */
export class ThemePerformanceMonitor {
  private static instance: ThemePerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): ThemePerformanceMonitor {
    if (!ThemePerformanceMonitor.instance) {
      ThemePerformanceMonitor.instance = new ThemePerformanceMonitor();
    }
    return ThemePerformanceMonitor.instance;
  }

  /**
   * 开始性能测量
   */
  public startMeasure(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  /**
   * 结束性能测量
   */
  public endMeasure(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (startTime === undefined) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(operation, duration);
    this.startTimes.delete(operation);

    console.log(`Theme operation "${operation}" took ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * 获取性能指标
   */
  public getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * 清除指标
   */
  public clearMetrics(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * 获取平均性能
   */
  public getAverageMetric(operation: string): number {
    const values = Array.from(this.metrics.entries())
      .filter(([key]) => key.includes(operation))
      .map(([, value]) => value);
    
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}

/**
 * 主题预加载器
 */
export class ThemePreloader {
  private static instance: ThemePreloader;
  private preloadedThemes: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): ThemePreloader {
    if (!ThemePreloader.instance) {
      ThemePreloader.instance = new ThemePreloader();
    }
    return ThemePreloader.instance;
  }

  /**
   * 预加载主题资源
   */
  public async preloadTheme(themeId: string): Promise<void> {
    if (this.preloadedThemes.has(themeId)) {
      return;
    }

    try {
      // 预加载主题相关的CSS变量
      const themeClass = `theme-${themeId}`;
      const testElement = document.createElement('div');
      testElement.className = themeClass;
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      testElement.style.pointerEvents = 'none';
      
      document.body.appendChild(testElement);
      
      // 强制浏览器计算样式
      window.getComputedStyle(testElement).getPropertyValue('--theme-bg-primary');
      
      document.body.removeChild(testElement);
      
      this.preloadedThemes.add(themeId);
      console.log(`Theme ${themeId} preloaded successfully`);
    } catch (error) {
      console.warn(`Failed to preload theme ${themeId}:`, error);
    }
  }

  /**
   * 批量预加载主题
   */
  public async preloadThemes(themeIds: string[]): Promise<void> {
    const promises = themeIds.map(id => this.preloadTheme(id));
    await Promise.allSettled(promises);
  }

  /**
   * 检查主题是否已预加载
   */
  public isPreloaded(themeId: string): boolean {
    return this.preloadedThemes.has(themeId);
  }

  /**
   * 清除预加载缓存
   */
  public clearCache(): void {
    this.preloadedThemes.clear();
  }
}

/**
 * 主题切换优化器
 */
export class ThemeOptimizer {
  private static instance: ThemeOptimizer;
  private performanceMonitor = ThemePerformanceMonitor.getInstance();
  private preloader = ThemePreloader.getInstance();

  private constructor() {}

  public static getInstance(): ThemeOptimizer {
    if (!ThemeOptimizer.instance) {
      ThemeOptimizer.instance = new ThemeOptimizer();
    }
    return ThemeOptimizer.instance;
  }

  /**
   * 优化的主题切换
   */
  public async optimizedThemeSwitch(
    themeId: string,
    applyThemeFunction: (className: string) => void,
    getThemeClassName: (id: string) => string
  ): Promise<void> {
    this.performanceMonitor.startMeasure(`theme-switch-${themeId}`);

    try {
      // 预加载主题（如果还没有预加载）
      if (!this.preloader.isPreloaded(themeId)) {
        await this.preloader.preloadTheme(themeId);
      }

      // 使用 requestAnimationFrame 确保在下一帧应用主题
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          const className = getThemeClassName(themeId);
          applyThemeFunction(className);
          resolve();
        });
      });

      // 等待一帧确保样式已应用
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => resolve());
      });

    } finally {
      this.performanceMonitor.endMeasure(`theme-switch-${themeId}`);
    }
  }

  /**
   * 批量预加载常用主题
   */
  public async preloadCommonThemes(): Promise<void> {
    const commonThemes = ['default', 'dark', 'masculine', 'feminine'];
    await this.preloader.preloadThemes(commonThemes);
  }

  /**
   * 获取性能报告
   */
  public getPerformanceReport(): {
    metrics: Record<string, number>;
    averages: Record<string, number>;
    recommendations: string[];
  } {
    const metrics = this.performanceMonitor.getMetrics();
    const averages = {
      'theme-switch': this.performanceMonitor.getAverageMetric('theme-switch'),
    };

    const recommendations: string[] = [];
    
    if (averages['theme-switch'] > 100) {
      recommendations.push('主题切换时间较长，建议预加载常用主题');
    }
    
    if (Object.keys(metrics).length > 50) {
      recommendations.push('性能指标过多，建议清理旧数据');
    }

    return { metrics, averages, recommendations };
  }

  /**
   * 清理性能数据
   */
  public cleanup(): void {
    this.performanceMonitor.clearMetrics();
    this.preloader.clearCache();
  }
}

// 导出单例实例
export const themePerformanceMonitor = ThemePerformanceMonitor.getInstance();
export const themePreloader = ThemePreloader.getInstance();
export const themeOptimizer = ThemeOptimizer.getInstance();