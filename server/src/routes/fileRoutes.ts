import { Router } from 'express';
import { fileController } from '../controllers/fileController';
import { requireAuth } from '../middleware/auth';
import { upload, handleUploadErrors } from '../middleware/upload';

const router = Router();

router.use(requireAuth);

router.get('/', fileController.getMyFiles);
router.post('/upload', upload.single('file'), handleUploadErrors, fileController.uploadFile);
router.get('/:id/download', fileController.downloadFile);
router.patch('/:id/rename', fileController.renameFile);
router.patch('/:id/favorite', fileController.toggleFavorite);
router.delete('/:id', fileController.deleteFile);

export default router;
