import sharp from 'sharp';
import path from 'path';

export class ImageProcessor {
  // 按比例压缩图片，保持宽高比
  static async generateProportionalThumbnail(
    inputPath: string, 
    outputPath: string, 
    maxDimension: number = 200,
    quality: number = 80
  ): Promise<{ originalSize: { width: number; height: number }; thumbnailSize: { width: number; height: number } }> {
    
    // 获取原图信息
    const imageInfo = await sharp(inputPath).metadata();
    const { width: originalWidth, height: originalHeight } = imageInfo;
    
    if (!originalWidth || !originalHeight) {
      throw new Error('无法获取图片尺寸信息');
    }

    // 计算按比例压缩后的尺寸
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;
    
    if (originalWidth > maxDimension || originalHeight > maxDimension) {
      if (originalWidth > originalHeight) {
        // 横向图片
        targetWidth = maxDimension;
        targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
      } else {
        // 纵向图片
        targetHeight = maxDimension;
        targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
      }
    }

    // 生成缩略图
    await sharp(inputPath)
      .resize(targetWidth, targetHeight, { 
        fit: 'inside', // 保持比例，不裁剪
        withoutEnlargement: true // 不放大小图片
      })
      .jpeg({ 
        quality,
        progressive: true, // 渐进式JPEG
        mozjpeg: true // 使用mozjpeg优化器
      })
      .toFile(outputPath);

    return {
      originalSize: { width: originalWidth, height: originalHeight },
      thumbnailSize: { width: targetWidth, height: targetHeight }
    };
  }

  // 生成多种尺寸的缩略图
  static async generateMultipleProportionalThumbnails(
    inputPath: string,
    outputDir: string,
    filename: string
  ): Promise<{ 
    small: string; 
    medium: string; 
    large: string;
    sizes: {
      small: { width: number; height: number };
      medium: { width: number; height: number };
      large: { width: number; height: number };
    };
  }> {
    
    const smallPath = path.join(outputDir, `${filename}_small.jpg`);
    const mediumPath = path.join(outputDir, `${filename}_medium.jpg`);
    const largePath = path.join(outputDir, `${filename}_large.jpg`);

    const [smallInfo, mediumInfo, largeInfo] = await Promise.all([
      this.generateProportionalThumbnail(inputPath, smallPath, 100, 70),
      this.generateProportionalThumbnail(inputPath, mediumPath, 200, 80),
      this.generateProportionalThumbnail(inputPath, largePath, 400, 85)
    ]);

    return {
      small: path.basename(smallPath),
      medium: path.basename(mediumPath),
      large: path.basename(largePath),
      sizes: {
        small: smallInfo.thumbnailSize,
        medium: mediumInfo.thumbnailSize,
        large: largeInfo.thumbnailSize
      }
    };
  }

  // 提取PNG元数据
  static async extractPNGMetadata(inputPath: string): Promise<Record<string, unknown>> {
    try {
      const metadata = await sharp(inputPath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasProfile: metadata.hasProfile,
        hasAlpha: metadata.hasAlpha,
        // 其他元数据...
      };
    } catch (error) {
      console.error('提取PNG元数据失败:', error);
      return {};
    }
  }
}
