import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

import os from 'os';

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
const BASE_UPLOAD_DIR = isServerless ? os.tmpdir() : process.cwd();

const TEMP_DIR = path.join(BASE_UPLOAD_DIR, 'uploads', 'temp');
const PROCESSED_DIR = path.join(BASE_UPLOAD_DIR, 'uploads', 'processed');

// Safely ensure directories exist without crashing on read-only serverless filesystems
try {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
  if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });
} catch {
  // In serverless environments, file storage is handled in-memory (multer.memoryStorage)
}

// Memory storage is great for fast document processing without leaving disk residue
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'text/markdown',
];

export const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
    files: 20, // Max 20 files per batch (e.g. image to pdf or merge)
  },
  fileFilter: (req, file, cb) => {
    // Check extension and mime type
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    const allowedExtensions = [
      '.pdf',
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.docx',
      '.doc',
      '.xlsx',
      '.xls',
      '.pptx',
      '.ppt',
      '.txt',
      '.md',
    ];

    if (allowedMimeTypes.includes(mime) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type (${file.originalname}). Allowed formats: PDF, JPG, PNG, WEBP, DOCX, XLSX, PPTX, TXT, MD.`
        )
      );
    }
  },
});

export function handleUploadErrors(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the ${config.maxFileSizeMb}MB limit. Please upload a smaller file or upgrade your plan.`,
        code: 'FILE_TOO_LARGE',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded at once. Maximum 20 files per batch.',
        code: 'TOO_MANY_FILES',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'UPLOAD_ERROR',
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed.',
      code: 'INVALID_FILE',
    });
  }
  next();
}

// Temporary file cleanup helper
export function cleanupTempFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Failed to delete temp file:', filePath, e);
    }
  }
}
