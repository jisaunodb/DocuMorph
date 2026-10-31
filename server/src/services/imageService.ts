import { getSharp, createPureJsPng, createPureJsJpeg } from './imageRasterizer';

export interface PngCompressOptions {
  level?: 'low' | 'medium' | 'high';
  quality?: number;
}

export interface PngToJpgOptions {
  quality?: number;
  background?: string;
}

export interface PngResizeOptions {
  width?: number;
  height?: number;
  fit?: 'contain' | 'cover' | 'fill' | 'inside';
  background?: string;
}

export interface PngWatermarkOptions {
  text: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
  position?: 'center' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-left';
}

export interface PngRemoveBgOptions {
  targetColor?: 'white' | 'black' | 'auto';
  tolerance?: number; // 0 to 100
}

export const imageService = {
  /**
   * Compress and optimize PNG image (TinyPNG style lossless/quantized compression)
   */
  async compressPng(buffer: Buffer, options: PngCompressOptions = {}): Promise<Buffer> {
    const sharp = await getSharp();
    if (!sharp) return buffer;

    try {
      const level = options.level || 'medium';
      let quality = options.quality || 80;
      let compressionLevel = 9;

      if (level === 'high') {
        quality = 65;
        compressionLevel = 9;
      } else if (level === 'low') {
        quality = 90;
        compressionLevel = 7;
      }

      return await sharp(buffer)
        .png({
          compressionLevel,
          palette: true,
          quality,
          effort: 8,
        })
        .toBuffer();
    } catch (err: any) {
      console.warn('[DocuMorph Engine] compressPng fallback to original buffer:', err?.message);
      return buffer;
    }
  },

  /**
   * Convert PNG image to high-quality JPG with custom background fill for transparency
   */
  async pngToJpg(buffer: Buffer, options: PngToJpgOptions = {}): Promise<Buffer> {
    const sharp = await getSharp();
    if (!sharp) return createPureJsJpeg();

    try {
      const quality = options.quality || 90;
      const background = options.background || '#ffffff';

      return await sharp(buffer)
        .flatten({ background })
        .jpeg({
          quality,
          mozjpeg: true,
        })
        .toBuffer();
    } catch (err: any) {
      console.warn('[DocuMorph Engine] pngToJpg fallback:', err?.message);
      return createPureJsJpeg();
    }
  },

  /**
   * Convert JPG image to lossless PNG
   */
  async jpgToPng(buffer: Buffer): Promise<Buffer> {
    const sharp = await getSharp();
    if (!sharp) return buffer;

    try {
      return await sharp(buffer)
        .png({
          compressionLevel: 8,
          effort: 6,
        })
        .toBuffer();
    } catch (err: any) {
      console.warn('[DocuMorph Engine] jpgToPng fallback:', err?.message);
      return buffer;
    }
  },

  /**
   * Convert PNG to modern WebP with alpha transparency
   */
  async pngToWebp(buffer: Buffer, options: { quality?: number; lossless?: boolean } = {}): Promise<Buffer> {
    const sharp = await getSharp();
    if (!sharp) return buffer;

    try {
      const quality = options.quality || 85;
      const lossless = options.lossless !== undefined ? options.lossless : false;

      return await sharp(buffer)
        .webp({
          quality,
          lossless,
          effort: 6,
        })
        .toBuffer();
    } catch (err: any) {
      console.warn('[DocuMorph Engine] pngToWebp fallback:', err?.message);
      return buffer;
    }
  },

  /**
   * Convert WebP back to lossless PNG with alpha channel intact
   */
  async webpToPng(buffer: Buffer): Promise<Buffer> {
    const sharp = await getSharp();
    if (!sharp) return buffer;

    try {
      return await sharp(buffer)
        .png({
          compressionLevel: 9,
          effort: 7,
        })
        .toBuffer();
    } catch (err: any) {
      console.warn('[DocuMorph Engine] webpToPng fallback:', err?.message);
      return buffer;
    }
  },

  /**
   * Resize PNG with aspect ratio preservation and optional transparent canvas padding
   */
  async resizePng(buffer: Buffer, options: PngResizeOptions): Promise<Buffer> {
    const sharp = await getSharp();
    if (!sharp) return buffer;

    try {
      const { width, height, fit = 'inside', background = { r: 0, g: 0, b: 0, alpha: 0 } } = options;

      return await sharp(buffer)
        .resize({
          width: width ? Math.max(1, Math.min(width, 10000)) : undefined,
          height: height ? Math.max(1, Math.min(height, 10000)) : undefined,
          fit,
          background,
          withoutEnlargement: false,
        })
        .png({ compressionLevel: 8 })
        .toBuffer();
    } catch (err: any) {
      console.warn('[DocuMorph Engine] resizePng fallback:', err?.message);
      return buffer;
    }
  },

  /**
   * Remove solid background (white or light/dark) and make PNG transparent
   */
  async removePngBackground(buffer: Buffer, options: PngRemoveBgOptions = {}): Promise<Buffer> {
    const sharp = await getSharp();
    if (!sharp) return buffer;

    try {
      const tolerance = options.tolerance !== undefined ? options.tolerance : 35;
      const target = options.targetColor || 'white';

      // Extract raw RGBA pixel data
      const image = sharp(buffer).ensureAlpha();
      const metadata = await image.metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 600;

      const rawBuffer = await image.raw().toBuffer();
      const totalPixels = width * height;

      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        const r = rawBuffer[idx];
        const g = rawBuffer[idx + 1];
        const b = rawBuffer[idx + 2];

        let isMatch = false;

        if (target === 'white') {
          const threshold = 255 - tolerance * 2.2;
          if (r >= threshold && g >= threshold && b >= threshold) {
            isMatch = true;
          }
        } else if (target === 'black') {
          const threshold = tolerance * 2.2;
          if (r <= threshold && g <= threshold && b <= threshold) {
            isMatch = true;
          }
        } else {
          const baseR = rawBuffer[0];
          const baseG = rawBuffer[1];
          const baseB = rawBuffer[2];
          const diff = Math.sqrt(
            Math.pow(r - baseR, 2) +
            Math.pow(g - baseG, 2) +
            Math.pow(b - baseB, 2)
          );
          if (diff <= tolerance * 2) {
            isMatch = true;
          }
        }

        if (isMatch) {
          rawBuffer[idx + 3] = 0; // Alpha 0
        }
      }

      return await sharp(rawBuffer, {
        raw: {
          width,
          height,
          channels: 4,
        },
      })
        .png({ compressionLevel: 8 })
        .toBuffer();
    } catch (err: any) {
      console.warn('[DocuMorph Engine] removePngBackground fallback:', err?.message);
      return buffer;
    }
  },

  /**
   * Add text watermark overlay onto PNG
   */
  async watermarkPng(buffer: Buffer, options: PngWatermarkOptions): Promise<Buffer> {
    const sharp = await getSharp();
    if (!sharp) return buffer;

    try {
      const text = options.text || 'CONFIDENTIAL';
      const opacity = options.opacity !== undefined ? Math.max(0.05, Math.min(options.opacity, 1)) : 0.35;
      const fontSize = options.fontSize || 36;
      const color = options.color || '#e11d48';

      const metadata = await sharp(buffer).metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 600;

      const svgOverlay = `
        <svg width="${width}" height="${height}">
          <style>
            .wm-text {
              font-family: Arial, Helvetica, sans-serif;
              font-size: ${fontSize}px;
              font-weight: bold;
              fill: ${color};
              fill-opacity: ${opacity};
              text-anchor: middle;
              dominant-baseline: middle;
            }
          </style>
          <g transform="translate(${width / 2}, ${height / 2}) rotate(-30)">
            <text class="wm-text" x="0" y="0">${text.replace(/[<>&]/g, '')}</text>
          </g>
        </svg>
      `;

      return await sharp(buffer)
        .composite([
          {
            input: Buffer.from(svgOverlay),
            top: 0,
            left: 0,
          },
        ])
        .png({ compressionLevel: 8 })
        .toBuffer();
    } catch (err: any) {
      console.warn('[DocuMorph Engine] watermarkPng fallback:', err?.message);
      return buffer;
    }
  },

  /**
   * Crop PNG to specific rectangular region
   */
  async cropPng(
    buffer: Buffer,
    options: { width: number; height: number; left?: number; top?: number }
  ): Promise<Buffer> {
    const sharp = await getSharp();
    if (!sharp) return buffer;

    try {
      const metadata = await sharp(buffer).metadata();
      const imgWidth = metadata.width || 800;
      const imgHeight = metadata.height || 600;

      const cropWidth = Math.min(options.width, imgWidth);
      const cropHeight = Math.min(options.height, imgHeight);
      const cropLeft = Math.max(0, Math.min(options.left || 0, imgWidth - cropWidth));
      const cropTop = Math.max(0, Math.min(options.top || 0, imgHeight - cropHeight));

      return await sharp(buffer)
        .extract({
          width: cropWidth,
          height: cropHeight,
          left: cropLeft,
          top: cropTop,
        })
        .png({ compressionLevel: 8 })
        .toBuffer();
    } catch (err: any) {
      console.warn('[DocuMorph Engine] cropPng fallback:', err?.message);
      return buffer;
    }
  },
};
