const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use memoryStorage for serverless platforms (Vercel) so files are safely kept in memory
// and can be saved directly as Data URLs into PostgreSQL or /tmp
const storage = multer.memoryStorage();

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WEBP, GIF, and SVG images are allowed.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 10, // Max 10 images at a time
  },
});

module.exports = {
  upload,
  uploadMultiple: upload.array('images', 10),
  uploadSingle: upload.single('image'),
};
