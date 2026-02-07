const crypto = require('crypto');
const db = require('../config/database');

// POST /api/students/applications
// Body: { destination_country, city, program, course_level, duration_years, course_fee_usd, living_cost_usd,
//         rent_usd, visa_fee_usd, insurance_usd }
// Auth: Bearer token required – student_id is extracted from req.user.id
const saveAcademicInfo = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { destination_country, city, program, course_level, duration_years, course_fee_usd, living_cost_usd,
            rent_usd, visa_fee_usd, insurance_usd } = req.body;

    // Validation
    if (!destination_country || !city || !program || !course_level || !duration_years || course_fee_usd === undefined || living_cost_usd === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: destination_country, city, program, course_level, duration_years, course_fee_usd, living_cost_usd'
      });
    }

    const validLevels = ['bachelor', 'master', 'phd', 'diploma'];
    if (!validLevels.includes(course_level)) {
      return res.status(400).json({ success: false, message: 'Invalid course_level. Must be one of: bachelor, master, phd, diploma' });
    }

    const duration = parseInt(duration_years);
    const fee = parseFloat(course_fee_usd);
    const living = parseFloat(living_cost_usd);

    if (isNaN(duration) || duration < 1 || duration > 10) {
      return res.status(400).json({ success: false, message: 'duration_years must be a number between 1 and 10' });
    }
    if (isNaN(fee) || fee < 0) {
      return res.status(400).json({ success: false, message: 'course_fee_usd must be a non-negative number' });
    }
    if (isNaN(living) || living < 0) {
      return res.status(400).json({ success: false, message: 'living_cost_usd must be a non-negative number' });
    }

    if (rent_usd === undefined || visa_fee_usd === undefined || insurance_usd === undefined) {
      return res.status(400).json({ success: false, message: 'All expense fields are required: rent_usd, visa_fee_usd, insurance_usd' });
    }

    const rent = parseFloat(rent_usd);
    const visaFee = parseFloat(visa_fee_usd);
    const insurance = parseFloat(insurance_usd);

    if (isNaN(rent) || rent < 0) {
      return res.status(400).json({ success: false, message: 'rent_usd must be a non-negative number' });
    }
    if (isNaN(visaFee) || visaFee < 0) {
      return res.status(400).json({ success: false, message: 'visa_fee_usd must be a non-negative number' });
    }
    if (isNaN(insurance) || insurance < 0) {
      return res.status(400).json({ success: false, message: 'insurance_usd must be a non-negative number' });
    }

    // Verify student exists
    const [students] = await db.execute('SELECT user_id FROM students WHERE user_id = ?', [studentId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const id = crypto.randomUUID();

    await db.execute(
      `INSERT INTO visa_applications (id, student_id, destination_country, city, program, course_level, duration_years, course_fee_usd, living_cost_usd, rent_usd, visa_fee_usd, insurance_usd)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, studentId, destination_country.trim(), city.trim(), program.trim(), course_level, duration, fee, living, rent, visaFee, insurance]
    );

    res.status(201).json({
      success: true,
      message: 'Academic information saved successfully',
      application: {
        id,
        destination_country,
        city,
        program,
        course_level,
        duration_years: duration,
        course_fee_usd: fee,
        living_cost_usd: living,
        rent_usd: rent,
        visa_fee_usd: visaFee,
        insurance_usd: insurance
      }
    });
  } catch (error) {
    console.error('Save academic info error:', error);
    res.status(500).json({ success: false, message: 'Failed to save academic information', error: error.message });
  }
};

// GET /api/students/applications
// Returns all visa applications for the authenticated student
const getApplications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [applications] = await db.execute(
      `SELECT id, destination_country, city, program, course_level, duration_years, course_fee_usd, living_cost_usd, rent_usd, visa_fee_usd, insurance_usd, selected_university, created_at, updated_at
       FROM visa_applications WHERE student_id = ? ORDER BY created_at DESC`,
      [studentId]
    );

    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications', error: error.message });
  }
};

// PUT /api/students/applications/selected-university
// Body: { application_id, university_name }
// Auth: Bearer token required
const saveSelectedUniversity = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { application_id, university_name } = req.body;

    if (!application_id || !university_name) {
      return res.status(400).json({ success: false, message: 'application_id and university_name are required' });
    }

    const [rows] = await db.execute(
      'SELECT id FROM visa_applications WHERE id = ? AND student_id = ?',
      [application_id, studentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await db.execute(
      'UPDATE visa_applications SET selected_university = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [university_name.trim(), application_id]
    );

    res.status(200).json({ success: true, message: 'University selection saved', university_name: university_name.trim() });
  } catch (error) {
    console.error('Save selected university error:', error);
    res.status(500).json({ success: false, message: 'Failed to save university selection', error: error.message });
  }
};

// GET /api/students/applications/agencies-by-university?university=<name>
// Returns all registered agencies that list the given university in their services
const getAgenciesByUniversity = async (req, res) => {
  try {
    const { university } = req.query;

    if (!university) {
      return res.status(400).json({ success: false, message: 'university query parameter is required' });
    }

    const [agencies] = await db.execute(
      `SELECT DISTINCT
              a.user_id as agency_id,
              a.agency_name,
              a.contact_phone,
              a.head_office_address,
              a.total_students_handled,
              a.total_visas_approved,
              a.approval_rate,
              s.country,
              s.processing_time
       FROM agencies a
       JOIN agency_services s ON a.user_id = s.user_id
       JOIN agency_universities u ON s.id = u.service_id
       WHERE u.university_name = ?`,
      [university]
    );

    res.status(200).json({ success: true, agencies });
  } catch (error) {
    console.error('Get agencies by university error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agencies', error: error.message });
  }
};

// POST /api/students/applications/send-request
// Body: { agency_name }
// Auth: Bearer token required – student_id from req.user.id
// Inserts a row into student_requests targeting the named agency
const sendAgencyRequest = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { agency_name } = req.body;

    if (!agency_name) {
      return res.status(400).json({ success: false, message: 'agency_name is required' });
    }

    // Resolve agency user_id from name
    const [agencies] = await db.execute(
      'SELECT user_id FROM agencies WHERE agency_name = ?',
      [agency_name.trim()]
    );
    if (agencies.length === 0) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }

    // student_requests.student_id FK → students.id (PK), not users.id
    const [studentRows] = await db.execute(
      'SELECT id FROM students WHERE user_id = ?',
      [studentId]
    );
    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    const studentPkId = studentRows[0].id;

    // Latest visa application holds the selected university and other details
    // visa_applications.student_id = users.id (= students.user_id)
    const [apps] = await db.execute(
      'SELECT * FROM visa_applications WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
      [studentId]
    );
    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'No visa application found. Please complete Step 1 first.' });
    }
    const app = apps[0];

    if (!app.selected_university) {
      return res.status(400).json({ success: false, message: 'No university selected yet.' });
    }

    const levelMap = { bachelor: 'undergraduate', master: 'masters', phd: 'phd', diploma: 'undergraduate' };

    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO student_requests (id, student_id, agency_id, target_country, target_university, program_level, intake_period, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
      [id, studentPkId, agencies[0].user_id, app.destination_country, app.selected_university,
       levelMap[app.course_level] || 'undergraduate',
       `${app.duration_years} year${Number(app.duration_years) > 1 ? 's' : ''}`]
    );

    res.status(201).json({ success: true, message: 'Request sent successfully', request_id: id });
  } catch (error) {
    console.error('Send agency request error:', error);
    res.status(500).json({ success: false, message: 'Failed to send request', error: error.message });
  }
};

// GET /api/students/applications/request-status
// Auth: Bearer token required – returns the latest student_request for this student
const getRequestStatus = async (req, res) => {
  try {
    const studentUserId = req.user.id;

    // students.id (PK) is what student_requests.student_id references
    const [studentRows] = await db.execute(
      'SELECT id FROM students WHERE user_id = ?',
      [studentUserId]
    );
    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const [rows] = await db.execute(
      `SELECT sr.id, sr.status, sr.target_university, sr.created_at,
              a.agency_name
       FROM student_requests sr
       JOIN agencies a ON sr.agency_id = a.user_id
       WHERE sr.student_id = ?
       ORDER BY sr.created_at DESC
       LIMIT 1`,
      [studentRows[0].id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No request found' });
    }

    res.status(200).json({ success: true, request: rows[0] });
  } catch (error) {
    console.error('Get request status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch request status', error: error.message });
  }
};

module.exports = {
  saveAcademicInfo,
  getApplications,
  saveSelectedUniversity,
  getAgenciesByUniversity,
  sendAgencyRequest,
  getRequestStatus
};
