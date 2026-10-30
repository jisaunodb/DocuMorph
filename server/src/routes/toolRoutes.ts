import { Router } from 'express';
import { toolController } from '../controllers/toolController';
import { upload, handleUploadErrors } from '../middleware/upload';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Process tool supports authenticated users and guests seamlessly
router.post(
  '/process/:toolSlug',
  optionalAuth,
  upload.any(),
  handleUploadErrors,
  toolController.processTool
);

// Inspect PDF metadata
router.post(
  '/inspect',
  upload.single('file'),
  handleUploadErrors,
  toolController.inspect
);

// Download processed file
router.get('/download/:id', toolController.download);

// High-fidelity image preview (works 100% in iframe and mobile)
router.get('/preview/:id', toolController.preview);

// Cloudinary connection diagnostics
router.get('/cloudinary-status', toolController.cloudinaryStatus);

export default router;
