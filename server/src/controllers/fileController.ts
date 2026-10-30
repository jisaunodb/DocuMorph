import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { dataStore } from '../services/dataStore';
import { uploadToCloudinary } from '../config/cloudinary';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'files');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const fileController = {
  async getMyFiles(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const files = await dataStore.getUserFilesAsync(req.user.id);
      return res.json({
        success: true,
        files,
        total: files.length,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve files.' });
    }
  },

  async uploadFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file was provided.' });
      }

      const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
      let category: 'pdf' | 'document' | 'image' | 'converted' = 'document';
      if (['pdf'].includes(ext)) category = 'pdf';
      else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) category = 'image';

      // Background Cloudinary attempt
      let cloudUrl = '';
      let cloudId = '';
      let thumbUrl = '';
      const cloudResult = await uploadToCloudinary(file.buffer, file.originalname);
      if (cloudResult) {
        cloudUrl = cloudResult.secureUrl;
        cloudId = cloudResult.publicId;
        thumbUrl = cloudResult.thumbnailUrl || '';
      }

      const created = await dataStore.createFileAsync({
        originalName: file.originalname,
        currentName: file.originalname,
        fileType: ext,
        mimeType: file.mimetype,
        fileSize: file.size,
        cloudinaryUrl: cloudUrl,
        cloudinaryPublicId: cloudId,
        thumbnailUrl: thumbUrl,
        owner: req.user.id,
        category,
        processingStatus: 'ready',
      });

      // Save to local disk cache for guaranteed downloads even if Cloudinary is not configured
      try {
        const diskPath = path.join(UPLOAD_DIR, `${created._id}_${file.originalname}`);
        fs.writeFileSync(diskPath, file.buffer);
      } catch (e) {
        console.warn('Failed to save uploaded file to disk cache:', e);
      }

      // Update storage
      const user = await dataStore.findUserByIdAsync(req.user.id);
      if (user) {
        await dataStore.updateUserAsync(user._id, {
          storageUsed: (user.storageUsed || 0) + file.size,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully.',
        file: created,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to upload file.' });
    }
  },

  async renameFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { id } = req.params;
      const { newName } = req.body;

      if (!newName || !newName.trim()) {
        return res.status(400).json({ success: false, message: 'New file name is required.' });
      }

      const file = dataStore.findFileById(id);
      if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

      // Only owner or admin can edit
      if (file.owner !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      const updated = dataStore.updateFile(id, { currentName: newName.trim() });
      return res.json({
        success: true,
        message: 'File renamed successfully.',
        file: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to rename file.' });
    }
  },

  async toggleFavorite(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { id } = req.params;
      const file = dataStore.findFileById(id);
      if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

      if (file.owner !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      const updated = dataStore.updateFile(id, { isFavorite: !file.isFavorite });
      return res.json({ success: true, file: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to toggle favorite.' });
    }
  },

  async deleteFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { id } = req.params;
      const file = dataStore.findFileById(id);
      if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

      if (file.owner !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      dataStore.deleteFile(id);

      // Decrement storage
      const user = await dataStore.findUserByIdAsync(req.user.id);
      if (user) {
        await dataStore.updateUserAsync(user._id, {
          storageUsed: Math.max(0, (user.storageUsed || 0) - file.fileSize),
        });
      }

      return res.json({
        success: true,
        message: 'File deleted permanently.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete file.' });
    }
  },

  async downloadFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { id } = req.params;
      const file = dataStore.findFileById(id);
      if (!file) return res.status(404).json({ success: false, message: 'File record not found.' });

      if (file.owner !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      if (file.cloudinaryUrl) {
        return res.redirect(file.cloudinaryUrl);
      }

      const diskPath = path.join(UPLOAD_DIR, `${id}_${file.originalName}`);
      if (fs.existsSync(diskPath)) {
        return res.download(diskPath, file.currentName);
      }

      // Check processed folder if created from a tool
      const processedDir = path.join(process.cwd(), 'uploads', 'processed');
      if (fs.existsSync(processedDir)) {
        const files = fs.readdirSync(processedDir);
        const match = files.find((f) => f.includes(file.originalName) || f.includes(file.currentName));
        if (match) {
          return res.download(path.join(processedDir, match), file.currentName);
        }
      }

      return res.status(404).json({ success: false, message: 'Physical file content is not available on server.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to download file.' });
    }
  },
};
