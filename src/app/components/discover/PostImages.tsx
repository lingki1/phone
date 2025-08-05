'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import './PostImages.css';

interface PostImagesProps {
  images: string[];
}

export default function PostImages({ images }: PostImagesProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handlePrevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedImage === null) return;
    
    switch (e.key) {
      case 'Escape':
        handleCloseModal();
        break;
      case 'ArrowLeft':
        handlePrevImage();
        break;
      case 'ArrowRight':
        handleNextImage();
        break;
    }
  };

  const getImageLayout = () => {
    const count = images.length;
    if (count === 1) return 'single';
    if (count === 2) return 'double';
    if (count === 3) return 'triple';
    if (count === 4) return 'quad';
    return 'grid';
  };

  const layout = getImageLayout();

  return (
    <>
      <div className={`post-images post-images-${layout}`}>
        {images.map((image, index) => (
          <div 
            key={index} 
            className="post-image-container"
            onClick={() => handleImageClick(index)}
          >
            <Image 
              src={image} 
              alt={`图片 ${index + 1}`}
              width={300}
              height={300}
              className="post-image"
              loading="lazy"
            />
            {images.length > 1 && (
              <div className="image-overlay">
                <span className="image-count">{index + 1}/{images.length}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 图片预览模态框 */}
      {selectedImage !== null && (
        <div 
          className="image-modal"
          onClick={handleCloseModal}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn"
              onClick={handleCloseModal}
              aria-label="关闭预览"
            >
              ×
            </button>
            
            {images.length > 1 && (
              <>
                <button 
                  className="modal-nav-btn modal-prev-btn"
                  onClick={handlePrevImage}
                  aria-label="上一张"
                >
                  ‹
                </button>
                <button 
                  className="modal-nav-btn modal-next-btn"
                  onClick={handleNextImage}
                  aria-label="下一张"
                >
                  ›
                </button>
              </>
            )}
            
            <Image 
              src={images[selectedImage]} 
              alt={`图片 ${selectedImage + 1}`}
              width={800}
              height={600}
              className="modal-image"
            />
            
            {images.length > 1 && (
              <div className="modal-indicators">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`modal-indicator ${index === selectedImage ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`跳转到图片 ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 