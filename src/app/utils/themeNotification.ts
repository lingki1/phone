'use client';

import { Theme } from '../types/theme';

/**
 * 主题通知系统
 * 用于显示主题切换相关的用户反馈
 */

export interface ThemeNotificationOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  showIcon?: boolean;
  autoClose?: boolean;
}

export class ThemeNotification {
  private static instance: ThemeNotification;
  private container: HTMLElement | null = null;
  private notifications: Map<string, HTMLElement> = new Map();

  private constructor() {
    this.createContainer();
  }

  public static getInstance(): ThemeNotification {
    if (!ThemeNotification.instance) {
      ThemeNotification.instance = new ThemeNotification();
    }
    return ThemeNotification.instance;
  }

  /**
   * 创建通知容器
   */
  private createContainer(): void {
    if (typeof window === 'undefined') return;

    this.container = document.createElement('div');
    this.container.id = 'theme-notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * 显示主题切换成功通知
   */
  public showThemeChanged(theme: Theme, options: ThemeNotificationOptions = {}): void {
    const {
      duration = 3000,
      showIcon = true,
      autoClose = true
    } = options;

    const notification = this.createNotification({
      type: 'success',
      title: '主题已切换',
      message: `已切换到 ${theme.name}`,
      icon: showIcon ? '🎨' : undefined,
      duration,
      autoClose
    });

    this.showNotification(notification, `theme-changed-${Date.now()}`);
  }

  /**
   * 显示主题切换错误通知
   */
  public showThemeError(error: string, options: ThemeNotificationOptions = {}): void {
    const {
      duration = 5000,
      showIcon = true,
      autoClose = true
    } = options;

    const notification = this.createNotification({
      type: 'error',
      title: '主题切换失败',
      message: error,
      icon: showIcon ? '❌' : undefined,
      duration,
      autoClose
    });

    this.showNotification(notification, `theme-error-${Date.now()}`);
  }

  /**
   * 显示主题预览通知
   */
  public showThemePreview(theme: Theme): void {
    const notification = this.createNotification({
      type: 'info',
      title: '主题预览',
      message: `正在预览 ${theme.name}`,
      icon: '👀',
      duration: 0,
      autoClose: false
    });

    this.showNotification(notification, 'theme-preview');
  }

  /**
   * 隐藏主题预览通知
   */
  public hideThemePreview(): void {
    this.hideNotification('theme-preview');
  }

  /**
   * 显示主题加载通知
   */
  public showThemeLoading(): void {
    const notification = this.createNotification({
      type: 'info',
      title: '正在加载主题',
      message: '请稍候...',
      icon: '⏳',
      duration: 0,
      autoClose: false
    });

    this.showNotification(notification, 'theme-loading');
  }

  /**
   * 隐藏主题加载通知
   */
  public hideThemeLoading(): void {
    this.hideNotification('theme-loading');
  }

  /**
   * 创建通知元素
   */
  private createNotification(config: {
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    icon?: string;
    duration: number;
    autoClose: boolean;
  }): HTMLElement {
    const notification = document.createElement('div');
    
    const typeColors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8',
      warning: '#ffc107'
    };

    notification.style.cssText = `
      background: ${typeColors[config.type]};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 8px;
      min-width: 280px;
      max-width: 400px;
      pointer-events: all;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      animation: slideInRight 0.3s ease-out;
      position: relative;
      overflow: hidden;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 8px;
    `;

    if (config.icon) {
      const iconElement = document.createElement('span');
      iconElement.textContent = config.icon;
      iconElement.style.cssText = `
        font-size: 16px;
        flex-shrink: 0;
        margin-top: 1px;
      `;
      content.appendChild(iconElement);
    }

    const textContent = document.createElement('div');
    textContent.style.cssText = `
      flex: 1;
    `;

    const title = document.createElement('div');
    title.textContent = config.title;
    title.style.cssText = `
      font-weight: 600;
      margin-bottom: 2px;
    `;

    const message = document.createElement('div');
    message.textContent = config.message;
    message.style.cssText = `
      font-weight: 400;
      opacity: 0.9;
    `;

    textContent.appendChild(title);
    textContent.appendChild(message);
    content.appendChild(textContent);

    // 添加关闭按钮
    if (config.autoClose && config.duration > 0) {
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s;
        flex-shrink: 0;
      `;
      
      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.opacity = '1';
      });
      
      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.opacity = '0.7';
      });

      content.appendChild(closeButton);
    }

    notification.appendChild(content);

    // 添加进度条（如果有持续时间）
    if (config.autoClose && config.duration > 0) {
      const progressBar = document.createElement('div');
      progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: rgba(255, 255, 255, 0.3);
        width: 100%;
        animation: progressBar ${config.duration}ms linear;
      `;
      notification.appendChild(progressBar);
    }

    return notification;
  }

  /**
   * 显示通知
   */
  private showNotification(notification: HTMLElement, id: string): void {
    if (!this.container) return;

    // 如果已存在相同ID的通知，先移除
    this.hideNotification(id);

    this.container.appendChild(notification);
    this.notifications.set(id, notification);

    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes progressBar {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    
    if (!document.getElementById('theme-notification-styles')) {
      style.id = 'theme-notification-styles';
      document.head.appendChild(style);
    }

    // 自动关闭
    const autoClose = notification.querySelector('button');
    if (autoClose) {
      const duration = parseInt(notification.style.animationDuration) || 3000;
      
      const closeHandler = () => {
        this.hideNotification(id);
      };
      
      autoClose.addEventListener('click', closeHandler);
      
      if (duration > 0) {
        setTimeout(closeHandler, duration);
      }
    }
  }

  /**
   * 隐藏通知
   */
  private hideNotification(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification || !this.container) return;

    notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
    
    setTimeout(() => {
      if (this.container && notification.parentNode === this.container) {
        this.container.removeChild(notification);
      }
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * 清除所有通知
   */
  public clearAll(): void {
    this.notifications.forEach((_, id) => {
      this.hideNotification(id);
    });
  }

  /**
   * 销毁通知系统
   */
  public destroy(): void {
    this.clearAll();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    
    const styles = document.getElementById('theme-notification-styles');
    if (styles && styles.parentNode) {
      styles.parentNode.removeChild(styles);
    }
  }
}

// 导出单例实例
export const themeNotification = ThemeNotification.getInstance();

// 便捷方法
export const showThemeSuccess = (theme: Theme, options?: ThemeNotificationOptions) => {
  themeNotification.showThemeChanged(theme, options);
};

export const showThemeError = (error: string, options?: ThemeNotificationOptions) => {
  themeNotification.showThemeError(error, options);
};

export const showThemePreview = (theme: Theme) => {
  themeNotification.showThemePreview(theme);
};

export const hideThemePreview = () => {
  themeNotification.hideThemePreview();
};

export const showThemeLoading = () => {
  themeNotification.showThemeLoading();
};

export const hideThemeLoading = () => {
  themeNotification.hideThemeLoading();
};