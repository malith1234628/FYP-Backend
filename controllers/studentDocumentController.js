const db = require('../config/database');

/**
 * Upload student documents (passport and/or CV)
 * Accepts multipart/form-data with 'passport' and/or 'cv' file fields
 * Files are stored in the database as binary data along with metadata
 */
const uploadStudentDocuments = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { userId } = req.body; // User ID from request body or JWT token
    const studentId = userId || req.user?.id; // Support both authenticated and non-authenticated uploads

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student user ID is required'
      });
    }

    // Check if files were uploaded
    const passportFile = req.files?.passport?.[0];
    const cvFile = req.files?.cv?.[0];

    if (!passportFile && !cvFile) {
      return res.status(400).json({
        success: false,
        message: 'At least one file (passport or CV) is required'
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Check if student exists
    const [students] = await connection.execute(
      'SELECT id, user_id FROM students WHERE user_id = ?',
      [studentId]
    );

    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Build update query dynamically based on uploaded files
    const updates = [];
    const values = [];

    if (passportFile) {
      updates.push(
        'passport_file = ?',
        'passport_filename = ?',
        'passport_mimetype = ?',
        'passport_uploaded_at = NOW()'
      );
      values.push(
        passportFile.buffer,
        passportFile.originalname,
        passportFile.mimetype
      );
    }

    if (cvFile) {
      updates.push(
        'cv_file = ?',
        'cv_filename = ?',
        'cv_mimetype = ?',
        'cv_uploaded_at = NOW()'
      );
      values.push(
        cvFile.buffer,
        cvFile.originalname,
        cvFile.mimetype
      );
    }

    // Add user_id for WHERE clause
    values.push(studentId);

    // Update student record with file data
    const updateQuery = `
      UPDATE students
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE user_id = ?
    `;

    await connection.execute(updateQuery, values);

    // Commit transaction
    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      uploaded: {
        passport: passportFile ? passportFile.originalname : null,
        cv: cvFile ? cvFile.originalname : null
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
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
