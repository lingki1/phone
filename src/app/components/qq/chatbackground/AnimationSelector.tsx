'use client';

import React from 'react';
import './AnimationSelector.css';

export interface AnimationOption {
  id: string;
  name: string;
  description: string;
  className: string;
  icon: string;
  category: 'subtle' | 'dynamic' | 'artistic' | 'none';
}

export const ANIMATION_OPTIONS: AnimationOption[] = [
  {
    id: 'none',
    name: '静态',
    description: '无动画效果',
    className: '',
    icon: '🖼️',
    category: 'none'
  },
  {
    id: 'slide',
    name: '背景移动',
    description: '背景图片缓慢移动',
    className: 'background-animation-slide',
    icon: '🌊',
    category: 'dynamic'
  },
  {
    id: 'breathe',
    name: '呼吸效果',
    description: '背景图片呼吸般缩放',
    className: 'background-animation-breathe',
    icon: '💨',
    category: 'dynamic'
  },
  {
    id: 'pulse',
    name: '脉冲效果',
    description: '背景图片脉冲闪烁',
    className: 'background-animation-pulse',
    icon: '💓',
    category: 'dynamic'
  },
  {
    id: 'wave',
    name: '波浪效果',
    description: '背景图片波浪般扭曲',
    className: 'background-animation-wave',
    icon: '🌊',
    category: 'artistic'
  },
  {
    id: 'focus',
    name: '聚焦效果',
    description: '背景图片模糊聚焦',
    className: 'background-animation-focus',
    icon: '🔍',
    category: 'artistic'
  }
];

interface AnimationSelectorProps {
  selectedAnimation: string;
  onAnimationChange: (animationId: string) => void;
  isVisible: boolean;
}

export default function AnimationSelector({
  selectedAnimation,
  onAnimationChange,
  isVisible
}: AnimationSelectorProps) {
  if (!isVisible) return null;

  const categories = [
    { id: 'none', name: '静态' },
    { id: 'dynamic', name: '动态效果' },
    { id: 'artistic', name: '艺术效果' }
  ];

  return (
    <div className="animation-selector">
      <h4>选择动画效果</h4>
      
      {categories.map(category => {
        const categoryAnimations = ANIMATION_OPTIONS.filter(
          anim => anim.category === category.id
        );
        
        if (categoryAnimations.length === 0) return null;
        
        return (
          <div key={category.id} className="animation-category">
            <h5>{category.name}</h5>
            <div className="animation-grid">
              {categoryAnimations.map(animation => (
                <div
                  key={animation.id}
                  className={`animation-option ${selectedAnimation === animation.id ? 'selected' : ''}`}
                  onClick={() => onAnimationChange(animation.id)}
                >
                  <div className="animation-icon">{animation.icon}</div>
                  <div className="animation-info">
                    <div className="animation-name">{animation.name}</div>
                    <div className="animation-description">{animation.description}</div>
                  </div>
                  {selectedAnimation === animation.id && (
                    <div className="animation-check">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      <div className="animation-tips">
        <small>
          💡 提示：动画效果会增加设备电量消耗，建议在移动端使用&ldquo;微妙&rdquo;类别的效果
        </small>
      </div>
    </div>
  );
} 