import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const storageService = {
  /**
   * Validate and save an uploaded file buffer or stream to local storage
   */
  async saveFile({ buffer, originalName, mimeType, stage = 'evidence' }) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}. Allowed formats are JPEG, PNG, WEBP, and PDF.`);
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File exceeds maximum permissible size limit of 10MB.`);
    }

    // Path traversal defense & safe unique filename generation
    const extension = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.bin';
    const uniqueId = crypto.randomUUID();
    const safeFilename = `${stage}_${Date.now()}_${uniqueId}${extension}`;

    // Target subfolder
    const targetDir = path.join(UPLOAD_ROOT, stage.replace(/[^a-z0-9_-]/gi, ''));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, safeFilename);

    // Verify target path remains within UPLOAD_ROOT (Defense against path traversal)
    if (!targetFilePath.startsWith(UPLOAD_ROOT)) {
      throw new Error('Security violation: Path traversal attempt detected.');
    }

    await fs.promises.writeFile(targetFilePath, buffer);

    const relativeUrl = `/uploads/${stage}/${safeFilename}`;
    return {
      fileName: safeFilename,
      fileUrl: relativeUrl,
      sizeBytes: buffer.length,
      mimeType
    };
  },

  /**
   * Remove a file from storage
   */
  async deleteFile(relativeUrl) {
    if (!relativeUrl || !relativeUrl.startsWith('/uploads/')) return false;
    const safeSubPath = relativeUrl.replace('/uploads/', '').replace(/\.\./g, '');
    const fullPath = path.join(UPLOAD_ROOT, safeSubPath);

    if (fullPath.startsWith(UPLOAD_ROOT) && fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }
};

export default storageService;
