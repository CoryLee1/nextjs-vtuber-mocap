import type { SocialCapturePreset } from '@/config/social-capture-presets';
import { DEFAULT_JPEG_QUALITY } from '@/config/social-capture-presets';

/**
 * 将截帧图片按预设尺寸裁剪（cover）并导出为 JPEG，便于控制文件大小、适配社交平台
 */
export function processCaptureToPreset(
  blobUrl: string,
  preset: SocialCapturePreset,
  quality: number = DEFAULT_JPEG_QUALITY
): Promise<{ blob: Blob; blobUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const { width: tw, height: th, aspect } = preset;
        const sw = img.width;
        const sh = img.height;
        const srcAspect = sw / sh;
        let sx = 0;
        let sy = 0;
        let sW = sw;
        let sH = sh;
        if (srcAspect > aspect) {
          sH = sh;
          sW = sh * aspect;
          sx = (sw - sW) / 2;
        } else {
          sW = sw;
          sH = sw / aspect;
          sy = (sh - sH) / 2;
        }
        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2d context not available'));
          return;
        }
        ctx.drawImage(img, sx, sy, sW, sH, 0, 0, tw, th);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('toBlob failed'));
              return;
            }
            const url = URL.createObjectURL(blob);
            resolve({ blob, blobUrl: url });
          },
          'image/jpeg',
          Math.max(0.1, Math.min(1, quality))
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load capture image'));
    img.src = blobUrl;
  });
}

export function getCaptureFileExtension(preset: SocialCapturePreset | null): 'png' | 'jpg' {
  return preset ? 'jpg' : 'png';
}

export function getCaptureMimeType(preset: SocialCapturePreset | null): 'image/png' | 'image/jpeg' {
  return preset ? 'image/jpeg' : 'image/png';
}
