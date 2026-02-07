const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadVisaDocuments, getVisaDocuments } = require('../controllers/documentUploadController');
const { authenticate } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDF, DOC, DOCX'), false);
    }
  }
});

// POST /api/students/visa-documents – upload SOP, IELTS, Birth Cert, Proof of Funds
router.post(
  '/',
  authenticate,
  upload.fields([
    { name: 'sop',       maxCount: 1 },
    { name: 'ielts',     maxCount: 1 },
    { name: 'birthCert', maxCount: 1 },
    { name: 'funds',     maxCount: 1 },
    { name: 'olCert',    maxCount: 1 },
    { name: 'alCert',    maxCount: 1 },
  ]),
  uploadVisaDocuments
);

// GET /api/students/visa-documents – list uploaded documents (metadata only)
router.get('/', authenticate, getVisaDocuments);

module.exports = router;
