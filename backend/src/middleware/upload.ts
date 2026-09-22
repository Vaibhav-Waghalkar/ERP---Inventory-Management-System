import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'bills');
const thumbnailsDir = path.join(process.cwd(), 'uploads', 'bills', 'thumbnails');

[uploadsDir, thumbnailsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `bill-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error: AppError = new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.');
    error.statusCode = 400;
    cb(error);
  }
};

// Configure multer
export const uploadBill = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Process and optimize image
export const processBillImage = async (filePath: string): Promise<string> => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    // Only process image files, not PDFs
    if (ext === '.pdf') {
      return filePath;
    }

    const filename = path.basename(filePath, ext);
    const thumbnailPath = path.join(thumbnailsDir, `${filename}-thumb${ext}`);

    // Create thumbnail (300x300 max, maintaining aspect ratio)
    await sharp(filePath)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Optimize original image (max 1920x1920, quality 85)
    await sharp(filePath)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    return filePath;
  } catch (error) {
    console.error('Error processing image:', error);
    // Return original path if processing fails
    return filePath;
  }
};

// Serve static files (to be used in index.ts)
export const getBillUrl = (filename: string): string => {
  return `/uploads/bills/${filename}`;
};

export const getThumbnailUrl = (filename: string): string => {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);
  return `/uploads/bills/thumbnails/${nameWithoutExt}-thumb${ext}`;
};

