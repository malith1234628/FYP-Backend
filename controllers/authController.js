const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');
const {
  validateStudentRegistration,
  validateAgencyRegistration,
  validateLogin
} = require('../utils/validation');

// Student Registration
const registerStudent = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { email, password, full_name, phone, country, date_of_birth } = req.body;

    // Validate input
    const errors = validateStudentRegistration(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Check if email already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate UUID for user
    const userId = crypto.randomUUID();

    // Insert into users table
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, user_type, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [userId, email, hashedPassword, 'student']
    );

    // Insert into students table
    await connection.execute(
      'INSERT INTO students (user_id, full_name, phone, date_of_birth, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [userId, full_name, phone, date_of_birth || null]
    );

    // Commit transaction
    await connection.commit();

    // Generate JWT token
    const token = generateToken({
      id: userId,
      email,
      role: 'STUDENT'
    });

    // Fetch the complete user with profile
    const [users] = await connection.execute(
      `SELECT u.id, u.email, u.user_type, u.created_at,
              s.full_name, s.phone, s.date_of_birth
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       WHERE u.id = ?`,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      user: users[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Student registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Agency Registration
const registerAgency = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { email, password, agency_name, phone, address, license_number, country_of_operation } = req.body;

    // Validate input
    const errors = validateAgencyRegistration(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Check if email already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate UUID for user
    const userId = crypto.randomUUID();

    // Insert into users table
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, user_type, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [userId, email, hashedPassword, 'agency']
    );

    // Insert into agencies table
    await connection.execute(
      'INSERT INTO agencies (user_id, agency_name, contact_phone, head_office_address, business_registration_number, country_of_operation, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, agency_name, phone, address, license_number, country_of_operation]
    );

    // Commit transaction
    await connection.commit();

    // Generate JWT token
    const token = generateToken({
      id: userId,
      email,
      role: 'AGENCY'
    });

    // Fetch the complete user with profile
    const [users] = await connection.execute(
      `SELECT u.id, u.email, u.user_type, u.created_at,
              a.agency_name, a.contact_phone, a.head_office_address, a.business_registration_number, a.country_of_operation
       FROM users u
       LEFT JOIN agencies a ON u.id = a.user_id
       WHERE u.id = ?`,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Agency registered successfully',
      token,
      user: users[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Agency registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Login (for both students and agencies)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const errors = validateLogin(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Find user by email
    const [users] = await db.execute(
      'SELECT id, email, password_hash, user_type FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.user_type
    });

    // Fetch complete user data with profile based on role
    let userData;

    if (user.user_type === 'student') {
      const [studentData] = await db.execute(
        `SELECT u.id, u.email, u.user_type, u.created_at,
                s.full_name, s.phone, s.date_of_birth
         FROM users u
         LEFT JOIN students s ON u.id = s.user_id
         WHERE u.id = ?`,
        [user.id]
      );
      userData = studentData[0];
    } else if (user.user_type === 'agency') {
      const [agencyData] = await db.execute(
        `SELECT u.id, u.email, u.user_type, u.created_at,
                a.agency_name, a.contact_phone, a.head_office_address, a.business_registration_number, a.country_of_operation
         FROM users u
         LEFT JOIN agencies a ON u.id = a.user_id
         WHERE u.id = ?`,
        [user.id]
      );
      userData = agencyData[0];
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user profile (protected route example)
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let userData;

    if (userRole === 'student') {
      const [studentData] = await db.execute(
        `SELECT u.id, u.email, u.user_type, u.created_at,
                s.full_name, s.phone, s.date_of_birth
         FROM users u
         LEFT JOIN students s ON u.id = s.user_id
         WHERE u.id = ?`,
        [userId]
      );
      userData = studentData[0];
    } else if (userRole === 'agency') {
      const [agencyData] = await db.execute(
        `SELECT u.id, u.email, u.user_type, u.created_at,
                a.agency_name, a.contact_phone, a.head_office_address, a.business_registration_number, a.country_of_operation
         FROM users u
         LEFT JOIN agencies a ON u.id = a.user_id
         WHERE u.id = ?`,
        [userId]
      );
      userData = agencyData[0];
    }

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Save Agency Services Configuration
const saveAgencyServices = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { user_id, services } = req.body;

    // services format: [{ country: 'UK', processing_time: '4-6 weeks', universities: ['Oxford', 'Cambridge'] }]

    if (!user_id || !services || !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: 'user_id and services array are required'
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Delete existing services for this agency
    await connection.execute(
      'DELETE FROM agency_services WHERE user_id = ?',
      [user_id]
    );

    // Insert new services
    for (const service of services) {
      if (!service.country || !service.processing_time || !service.universities) {
        continue;
      }

      const [result] = await connection.execute(
        'INSERT INTO agency_services (user_id, country, processing_time) VALUES (?, ?, ?)',
        [user_id, service.country, service.processing_time]
      );

      const serviceId = result.insertId;

      // Insert universities for this service
      for (const university of service.universities) {
        if (university) {
          await connection.execute(
            'INSERT INTO agency_universities (service_id, university_name) VALUES (?, ?)',
            [serviceId, university]
          );
        }
      }
    }

    // Commit transaction
    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Agency services saved successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Save agency services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save services',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Save Agency Statistics (Step 3 - Performance Information)
const saveAgencyStatistics = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { user_id, total_students_handled, total_visas_approved } = req.body;

    // Validate input
    if (!user_id || total_students_handled === undefined || total_visas_approved === undefined) {
      return res.status(400).json({
        success: false,
        message: 'user_id, total_students_handled, and total_visas_approved are required'
      });
    }

    // Validate numbers
    const studentsHandled = parseInt(total_students_handled);
    const visasApproved = parseInt(total_visas_approved);

    if (isNaN(studentsHandled) || isNaN(visasApproved) || studentsHandled < 0 || visasApproved < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid numbers provided for students or visas'
      });
    }

    if (visasApproved > studentsHandled) {
      return res.status(400).json({
        success: false,
        message: 'Total visas approved cannot exceed total students handled'
      });
    }

    // Calculate approval rate (as a percentage)
    const approvalRate = studentsHandled > 0
      ? parseFloat(((visasApproved / studentsHandled) * 100).toFixed(2))
      : 0;

    // Start transaction
    await connection.beginTransaction();

    // Check if agency exists
    const [agencies] = await connection.execute(
      'SELECT user_id FROM agencies WHERE user_id = ?',
      [user_id]
    );

    if (agencies.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Update agencies table with statistics
    await connection.execute(
      `UPDATE agencies
       SET total_students_handled = ?,
           total_visas_approved = ?,
           approval_rate = ?,
           updated_at = NOW()
       WHERE user_id = ?`,
      [studentsHandled, visasApproved, approvalRate, user_id]
    );

    // Commit transaction
    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Agency statistics saved successfully',
      data: {
        total_students_handled: studentsHandled,
        total_visas_approved: visasApproved,
        approval_rate: approvalRate
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Save agency statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save agency statistics',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Save University Forms (Step 4 - Form Builder)
const saveUniversityForms = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { user_id, university_forms } = req.body;

    // Validate input
    if (!user_id || !university_forms || typeof university_forms !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'user_id and university_forms object are required'
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Get agency_id from user_id
    const [agencies] = await connection.execute(
      'SELECT id FROM agencies WHERE user_id = ?',
      [user_id]
    );

    if (agencies.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Agency not found for this user'
      });
    }

    const agencyId = agencies[0].id;
    const savedForms = [];
    const errors = [];

    // Process each university form
    for (const [universityName, formData] of Object.entries(university_forms)) {
      try {
        const { formTitle, formDescription, questions } = formData;

        // Validate form data
        if (!formTitle || !questions || !Array.isArray(questions)) {
          errors.push({ university: universityName, error: 'Invalid form data' });
          continue;
        }

        // Find the agency_university_id for this university
        const [universityRecords] = await connection.execute(
          `SELECT au.id
           FROM agency_universities au
           JOIN agency_services as2 ON au.service_id = as2.id
           WHERE as2.user_id = ? AND au.university_name = ?
           LIMIT 1`,
          [user_id, universityName]
        );

        const agencyUniversityId = universityRecords.length > 0 ? universityRecords[0].id : null;

        // Generate UUID for form
        const formId = crypto.randomUUID();

        // Check if form already exists for this agency and university
        const [existingForms] = await connection.execute(
          `SELECT id FROM university_forms
           WHERE agency_id = ? AND agency_university_id = ?`,
          [agencyId, agencyUniversityId]
        );

        if (existingForms.length > 0) {
          // Update existing form
          await connection.execute(
            `UPDATE university_forms
             SET form_title = ?,
                 form_description = ?,
                 questions = ?,
                 updated_at = NOW()
             WHERE agency_id = ? AND agency_university_id = ?`,
            [
              formTitle,
              formDescription || '',
              JSON.stringify(questions),
              agencyId,
              agencyUniversityId
            ]
          );

          savedForms.push({
            university: universityName,
            form_id: existingForms[0].id,
            action: 'updated'
          });
        } else {
          // Insert new form
          await connection.execute(
            `INSERT INTO university_forms
             (id, agency_id, agency_university_id, form_title, form_description, questions, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              formId,
              agencyId,
              agencyUniversityId,
              formTitle,
              formDescription || '',
              JSON.stringify(questions)
            ]
          );

          savedForms.push({
            university: universityName,
            form_id: formId,
            action: 'created'
          });
        }
      } catch (formError) {
        console.error(`Error saving form for ${universityName}:`, formError);
        errors.push({
          university: universityName,
          error: formError.message
        });
      }
    }

    // Commit transaction
    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'University forms saved successfully',
      data: {
        saved_forms: savedForms,
        total_saved: savedForms.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Save university forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save university forms',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get University Form by Agency and University
const getUniversityForm = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { agency_id, university_name } = req.query;

    console.log('📥 Get form request:', { agency_id, university_name });

    if (!agency_id || !university_name) {
      return res.status(400).json({
        success: false,
        message: 'agency_id and university_name are required'
      });
    }

    // First, find the agency_university_id by joining through agency_services
    const [agencyUniversities] = await connection.execute(
      `SELECT au.id 
       FROM agency_universities au
       JOIN agency_services s ON au.service_id = s.id
       WHERE s.user_id = ? AND au.university_name = ?`,
      [agency_id, university_name]
    );

    console.log('🔍 Found agency_universities:', agencyUniversities);

    if (agencyUniversities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No services found for this agency and university combination'
      });
    }

    const agencyUniversityId = agencyUniversities[0].id;

    // Fetch the form
    const [forms] = await connection.execute(
      `SELECT id, form_title, form_description, questions, created_at, updated_at
       FROM university_forms 
       WHERE agency_university_id = ?`,
      [agencyUniversityId]
    );

    console.log('📋 Found forms:', forms.length);

    if (forms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No form found for this university. The agency may not have created a form yet.'
      });
    }

    const form = forms[0];
    
    // Parse the JSON questions
    let questions = [];
    if (form.questions) {
      try {
        questions = typeof form.questions === 'string' 
          ? JSON.parse(form.questions) 
          : form.questions;
      } catch (parseError) {
        console.error('Error parsing questions:', parseError);
      }
    }

    return res.status(200).json({
      success: true,
      form: {
        id: form.id,
        formTitle: form.form_title,
        formDescription: form.form_description,
        questions: questions,
        createdAt: form.created_at,
        updatedAt: form.updated_at
      }
    });

  } catch (error) {
    console.error('Get university form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch university form',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  registerStudent,
  registerAgency,
  login,
  getProfile,
  saveAgencyServices,
  saveAgencyStatistics,
  saveUniversityForms,
  getUniversityForm
};
