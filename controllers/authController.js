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
    const { email, password, agency_name, phone, address, license_number } = req.body;

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
      'INSERT INTO agencies (user_id, agency_name, contact_phone, head_office_address, business_registration_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, agency_name, phone, address, license_number || null]
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
              a.agency_name, a.contact_phone, a.head_office_address, a.business_registration_number
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
                a.agency_name, a.contact_phone, a.head_office_address, a.business_registration_number
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
                a.agency_name, a.contact_phone, a.head_office_address, a.business_registration_number
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

module.exports = {
  registerStudent,
  registerAgency,
  login,
  getProfile
};
