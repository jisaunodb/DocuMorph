import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { config } from './env';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  thumbnailUrl?: string;
  format?: string;
}

// Configure Cloudinary SDK
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder = 'documorph'
): Promise<CloudinaryUploadResult | null> {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    return null; // Cloudinary not configured
  }

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[Cloudinary SDK] Upload timed out after 8s; proceeding with local storage.');
        resolve(null);
      }
    }, 8000);

    try {
      const isPdf = filename.toLowerCase().endsWith('.pdf');
      const isImage = /\.(jpe?g|png|webp|gif|svg|bmp|tiff)$/i.test(filename);
      const ext = path.extname(filename).toLowerCase().replace('.', '') || 'bin';
      const cleanPublicId = filename.replace(/\.[^/.]+$/, '').replace(/[^\w-]/g, '_');
      const publicId = `${cleanPublicId}_${Date.now()}`;

      // In Cloudinary, uploading PDFs as 'image' resource type enables automatic page 1 rasterization,
      // high-resolution thumbnail generation, and visual previews in the Cloudinary Media Library dashboard.
      const resourceType: 'image' | 'raw' = isPdf || isImage ? 'image' : 'raw';

      const uploadOptions: Record<string, any> = {
        folder,
        resource_type: resourceType,
        public_id: resourceType === 'raw' ? `${publicId}.${ext}` : publicId,
        overwrite: true,
      };

      if (isPdf) {
        uploadOptions.format = 'pdf';
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          clearTimeout(timer);
          if (resolved) return;
          resolved = true;

          if (error) {
            console.warn('[Cloudinary SDK] Upload failed:', error.message || error);
            return resolve(null);
          }
          if (!result) {
            return resolve(null);
          }
          console.log('[Cloudinary SDK] Upload succeeded with visual preview:', result.secure_url);

          const thumbnailUrl = isPdf
            ? result.secure_url.replace(/\.pdf$/i, '.jpg')
            : isImage
            ? result.secure_url
            : undefined;

          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            thumbnailUrl,
            format: result.format,
          });
        }
      );

      uploadStream.end(buffer);
    } catch (err: any) {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        console.warn('[Cloudinary SDK] Error during upload stream:', err.message || err);
        resolve(null);
      }
    }
  });
}

export async function testCloudinaryConnection(): Promise<{
  connected: boolean;
  cloudName: string;
  apiKey: string;
  secretLength: number;
  message: string;
}> {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    return {
      connected: false,
      cloudName: cloudName || 'Missing',
      apiKey: apiKey ? `${apiKey.slice(0, 4)}...` : 'Missing',
      secretLength: apiSecret ? apiSecret.length : 0,
      message: 'Cloudinary environment variables are missing.',
    };
  }

  try {
    await new Promise<any>((resolve, reject) => {
      cloudinary.api.ping((err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    return {
      connected: true,
      cloudName,
      apiKey: `${apiKey.slice(0, 4)}...`,
      secretLength: apiSecret.length,
      message: 'Cloudinary connection verified successfully.',
    };
  } catch (err: any) {
    let hint = '';
    if (err.http_code === 401 || err.message?.includes('api_secret mismatch')) {
      hint = 'api_secret mismatch! It appears you entered your account login password instead of the Cloudinary API Secret. The API Secret is a 27-28 character random string found in Cloudinary Console > Settings > API Keys.';
    }
    return {
      connected: false,
      cloudName,
      apiKey: `${apiKey.slice(0, 4)}...`,
      secretLength: apiSecret.length,
      message: hint || err.message || 'Cloudinary authentication failed.',
    };
  }
}

