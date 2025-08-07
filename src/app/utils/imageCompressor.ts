/**
 * 图片压缩工具
 * 使用 Canvas API 压缩图片，支持质量调节和尺寸限制
 */

interface CompressOptions {
  quality?: number; // 压缩质量 0-1
  maxWidth?: number; // 最大宽度
  maxHeight?: number; // 最大高度
  maxSize?: number; // 最大文件大小（字节）
}

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns Promise<string> 压缩后的 base64 字符串
 */
export async function compressImage(
  file: File, 
  options: CompressOptions = {}
): Promise<string> {
  const {
    quality = 0.8,
    maxWidth = 800,
    maxHeight = 800,
    maxSize = 2 * 1024 * 1024 // 2MB
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // 设置 canvas 尺寸
      canvas.width = width;
      canvas.height = height;

      // 绘制图片
      ctx?.drawImage(img, 0, 0, width, height);

      // 转换为 base64
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // 检查文件大小
      const base64Size = Math.ceil((compressedDataUrl.length * 3) / 4);
      
      if (base64Size > maxSize) {
        // 如果还是太大，进一步降低质量
        const newQuality = quality * 0.8;
        const furtherCompressed = canvas.toDataURL('image/jpeg', newQuality);
        resolve(furtherCompressed);
      } else {
        resolve(compressedDataUrl);
      }
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    // 读取文件
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 获取图片信息
 * @param file 图片文件
 * @returns Promise<{width: number, height: number, size: number}>
 */
export function getImageInfo(file: File): Promise<{width: number, height: number, size: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size
      });
    };
    
    img.onerror = () => {
      reject(new Error('无法获取图片信息'));
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
