// src/config/multer.config.ts
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

/* ---------- THUMBNAILS (IMAGES ONLY) ---------- */
export const imageMulterConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
};

/* ---------- BOOK FILES (PDF, DOC, etc) ---------- */
export const bookMulterConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = /(pdf|doc|docx|ppt|pptx|txt)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(
        new Error('Only PDF, DOC, DOCX, PPT, PPTX, TXT files are allowed!'),
        false,
      );
    }
    cb(null, true);
  },
};

// Aliases for compatibility
export const documentMulterConfig = bookMulterConfig;
export const multerConfig = bookMulterConfig;