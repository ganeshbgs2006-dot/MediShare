import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUploadDir = path.resolve(__dirname, '../../uploads');
const photoUploadDir = path.join(baseUploadDir, 'photos');
const videoUploadDir = path.join(baseUploadDir, 'videos');

// Ensure upload directories exist
[photoUploadDir, videoUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure disk storage for photos
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, photoUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

// Photo file filter
const photoFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMime.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Allowed formats: JPEG, PNG, WebP.'), false);
  }
};

// Configure disk storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.webm';
    const safeName = `video-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

// Video file filter
const videoFilter = (req, file, cb) => {
  const allowedMime = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'application/octet-stream' // Browsers sometimes send MediaRecorder webm as octet-stream
  ];
  if (allowedMime.includes(file.mimetype.toLowerCase()) || file.originalname.endsWith('.webm') || file.originalname.endsWith('.mp4')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid video type. Allowed formats: MP4, WebM, QuickTime.'), false);
  }
};

export const uploadSinglePhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: photoFilter
}).single('photo');

export const uploadMultiplePhotos = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: photoFilter
}).array('photos', 5); // Max 5 photos

export const uploadReturnVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: videoFilter
}).single('video');

export default {
  uploadSinglePhoto,
  uploadMultiplePhotos,
  uploadReturnVideo
};

