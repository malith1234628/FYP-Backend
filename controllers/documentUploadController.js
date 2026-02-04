const crypto = require('crypto');
const db = require('../config/database');

// Maps the multer field names to the document_type enum values in the DB
const FIELD_TO_DOC_TYPE = {
  sop:       'sop',
  ielts:     'ielts_certificate',
  birthCert: 'birth_certificate',
  funds:     'proof_of_funds',
  olCert:    'ol_certificate',
  alCert:    'al_certificate',
};

// POST /api/students/visa-documents
// Multipart fields: sop, ielts, birthCert, funds (each max 1 file)
// Auth: Bearer token required
const uploadVisaDocuments = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const studentId = req.user.id;

    // Find the student's most recent visa_application
    const [apps] = await connection.execute(
      'SELECT id FROM visa_applications WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
      [studentId]
    );

    if (apps.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No visa application found. Please complete the Academic Information step first.'
      });
    }

    const visaApplicationId = apps[0].id;

    // Collect which files were actually sent
    const fileFields = Object.keys(FIELD_TO_DOC_TYPE); // ['sop','ielts','birthCert','funds']
    const uploaded = [];

    await connection.beginTransaction();

    for (const field of fileFields) {
      const file = req.files?.[field]?.[0];
      if (!file) continue;

      const id = crypto.randomUUID();
      const docType = FIELD_TO_DOC_TYPE[field];

      await connection.execute(
        `INSERT INTO documents (id, application_id, uploaded_by_user_id, document_type, file_name, file_url, file_size, file_type, file_data, visa_application_id, uploaded_at)
         VALUES (?, NULL, ?, ?, ?, '', ?, ?, ?, ?, NOW())`,
        [id, studentId, docType, file.originalname, file.size, file.mimetype, file.buffer, visaApplicationId]
      );

      uploaded.push({ id, document_type: docType, file_name: file.originalname });
    }

    if (uploaded.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'No files were uploaded.' });
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `${uploaded.length} document(s) uploaded successfully`,
      uploaded
    });
  } catch (error) {
    await connection.rollback();
    console.error('Visa document upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload documents', error: error.message });
  } finally {
    connection.release();
  }
};

// GET /api/students/visa-documents
// Returns metadata (no file_data blob) for the student's latest visa application
// Auth: Bearer token required
const getVisaDocuments = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find latest visa_application for this student
    const [apps] = await db.execute(
      'SELECT id FROM visa_applications WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
      [studentId]
    );

    if (apps.length === 0) {
      return res.status(200).json({ success: true, documents: [] });
    }

    const [documents] = await db.execute(
      `SELECT id, document_type, file_name, file_size, file_type, uploaded_at
       FROM documents
       WHERE visa_application_id = ?
       ORDER BY uploaded_at DESC`,
      [apps[0].id]
    );

    res.status(200).json({ success: true, documents });
  } catch (error) {
    console.error('Get visa documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents', error: error.message });
  }
};

module.exports = {
  uploadVisaDocuments,
  getVisaDocuments
};
