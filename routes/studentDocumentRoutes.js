const express = require('express');
const multer = require('multer');
const {
  uploadStudentDocuments,
  downloadStudentDocument,
  getDocumentStatus
} = require('../controllers/studentDocumentController');

const router = express.Router();

// Configure multer for file uploads
// Store files in memory as Buffer objects
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept images for passport and PDF/DOC/DOCX for CV
    const allowedMimetypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}. Passport must be an image, CV must be PDF/DOC/DOCX.`), false);
    }
  }
});

/**
 * POST /api/students/documents/upload
 * Upload passport and/or CV documents
 * Accepts multipart/form-data with fields:
 * - userId: string (required) - The user ID
 * - passport: file (optional) - Passport image file
 * - cv: file (optional) - CV document file
 */
router.post(
  '/upload',
  upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'cv', maxCount: 1 }
  ]),
  uploadStudentDocuments
);

/**
 * GET /api/students/documents/:userId/:documentType
 * Download a specific document (passport or cv)
 * documentType must be either 'passport' or 'cv'
 */
router.get(
  '/:userId/:documentType',
  downloadStudentDocument
);

/**
 * GET /api/students/documents/:userId/status
 * Get upload status for student documents
 */
router.get(
  '/:userId/status',
  getDocumentStatus
);

module.exports = router;
