const db = require('../config/database');
const axios = require('axios');
const FormData = require('form-data');

const FLASK_URL = process.env.FLASK_URL || 'http://127.0.0.1:5001';

// ---------------------------------------------------------------------------
// OCR helpers – call Flask, return extracted_data or null on any failure
// ---------------------------------------------------------------------------
async function runPassportOCR(file) {
  try {
    const fd = new FormData();
    fd.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });

    const { data } = await axios.post(`${FLASK_URL}/extract_passport`, fd, {
      headers: fd.getHeaders(),
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return data?.extracted_data || null;
  } catch (err) {
    console.error('Passport OCR failed:', err.message);
    return null;
  }
}

async function runCvOCR(file) {
  try {
    const fd = new FormData();
    fd.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });

    const { data } = await axios.post(`${FLASK_URL}/extract_cv`, fd, {
      headers: fd.getHeaders(),
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return data?.extracted_data || null;
  } catch (err) {
    console.error('CV OCR failed:', err.message);
    return null;
  }
}

/**
 * Upload student documents (passport and/or CV).
 * After persisting the raw files the handler fires both OCR extractors
 * in parallel, saves whatever they return into the JSON columns, and
 * includes the extracted data in the response.
 */
const uploadStudentDocuments = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { userId } = req.body;
    const studentId = userId || req.user?.id;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student user ID is required' });
    }

    const passportFile = req.files?.passport?.[0];
    const cvFile = req.files?.cv?.[0];

    if (!passportFile && !cvFile) {
      return res.status(400).json({ success: false, message: 'At least one file (passport or CV) is required' });
    }

    // Kick off OCR extractions immediately – they run while we hit the DB
    const [passportExtracted, cvExtracted] = await Promise.all([
      passportFile ? runPassportOCR(passportFile) : null,
      cvFile        ? runCvOCR(cvFile)            : null,
    ]);

    await connection.beginTransaction();

    // Verify student row exists
    const [students] = await connection.execute(
      'SELECT user_id FROM students WHERE user_id = ?', [studentId]
    );
    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Build SET clause dynamically
    const sets  = [];
    const vals  = [];

    if (passportFile) {
      sets.push('passport_file = ?', 'passport_filename = ?', 'passport_mimetype = ?', 'passport_uploaded_at = NOW()');
      vals.push(passportFile.buffer, passportFile.originalname, passportFile.mimetype);

      if (passportExtracted) {
        sets.push('passport_extracted_data = ?');
        vals.push(JSON.stringify(passportExtracted));
      }
    }

    if (cvFile) {
      sets.push('cv_file = ?', 'cv_filename = ?', 'cv_mimetype = ?', 'cv_uploaded_at = NOW()');
      vals.push(cvFile.buffer, cvFile.originalname, cvFile.mimetype);

      if (cvExtracted) {
        sets.push('cv_extracted_data = ?');
        vals.push(JSON.stringify(cvExtracted));
      }
    }

    vals.push(studentId); // WHERE clause

    await connection.execute(
      `UPDATE students SET ${sets.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
      vals
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Documents uploaded and data extracted successfully',
      uploaded: {
        passport: passportFile ? passportFile.originalname : null,
        cv:       cvFile        ? cvFile.originalname        : null,
      },
      extracted: {
        passport: passportExtracted,
        cv:       cvExtracted,
      },
    });

  } catch (error) {
    await connection.rollback();
    console.error('Document upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload documents', error: error.message });
  } finally {
    connection.release();
  }
};

/**
 * Download student document (passport or CV)
 * Returns the file with appropriate headers
 */
const downloadStudentDocument = async (req, res) => {
  try {
    const { userId, documentType } = req.params;

    if (!['passport', 'cv'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Must be "passport" or "cv"'
      });
    }

    // Determine which columns to fetch based on document type
    const fileColumn = documentType === 'passport' ? 'passport_file' : 'cv_file';
    const filenameColumn = documentType === 'passport' ? 'passport_filename' : 'cv_filename';
    const mimetypeColumn = documentType === 'passport' ? 'passport_mimetype' : 'cv_mimetype';

    // Fetch document from database
    const [students] = await db.execute(
      `SELECT ${fileColumn} as file_data, ${filenameColumn} as filename, ${mimetypeColumn} as mimetype
       FROM students
       WHERE user_id = ?`,
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const student = students[0];

    if (!student.file_data) {
      return res.status(404).json({
        success: false,
        message: `${documentType === 'passport' ? 'Passport' : 'CV'} not found for this student`
      });
    }

    // Set appropriate headers and send file
    res.setHeader('Content-Type', student.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${student.filename}"`);
    res.send(student.file_data);

  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document',
      error: error.message
    });
  }
};

/**
 * Get student document status
 * Returns information about which documents have been uploaded
 */
const getDocumentStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const [students] = await db.execute(
      `SELECT
        passport_filename,
        passport_mimetype,
        passport_uploaded_at,
        cv_filename,
        cv_mimetype,
        cv_uploaded_at
       FROM students
       WHERE user_id = ?`,
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const student = students[0];

    res.status(200).json({
      success: true,
      documents: {
        passport: {
          uploaded: !!student.passport_filename,
          filename: student.passport_filename,
          mimetype: student.passport_mimetype,
          uploadedAt: student.passport_uploaded_at
        },
        cv: {
          uploaded: !!student.cv_filename,
          filename: student.cv_filename,
          mimetype: student.cv_mimetype,
          uploadedAt: student.cv_uploaded_at
        }
      }
    });

  } catch (error) {
    console.error('Get document status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document status',
      error: error.message
    });
  }
};

module.exports = {
  uploadStudentDocuments,
  downloadStudentDocument,
  getDocumentStatus
};
