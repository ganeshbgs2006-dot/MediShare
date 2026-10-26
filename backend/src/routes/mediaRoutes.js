import { Router } from 'express';
import { mediaController } from '../controllers/mediaController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSinglePhoto, uploadMultiplePhotos, uploadReturnVideo } from '../middleware/upload.js';

const router = Router();

// Wrap multer middleware to handle file size/format errors gracefully
function handleUpload(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File size exceeds allowed limit (10MB for photos, 100MB for return video recordings).'
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload failed.'
        });
      }
      next();
    });
  };
}

// All media upload endpoints require an authenticated user
router.use(authenticateToken);

// Single photo upload (equipment primary image, profile avatar)
router.post('/upload/photo', handleUpload(uploadSinglePhoto), mediaController.uploadPhoto);

// Multiple photos upload (equipment image gallery, max 5)
router.post('/upload/photos', handleUpload(uploadMultiplePhotos), mediaController.uploadMultiplePhotos);

// Return condition video recording upload (Seeker or Owner return evidence)
router.post('/upload/video', handleUpload(uploadReturnVideo), mediaController.uploadVideo);

export default router;

