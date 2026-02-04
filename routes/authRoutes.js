const express = require('express');
const router = express.Router();
const {
  registerStudent,
  registerAgency,
  login,
  getProfile,
  saveAgencyServices,
  saveAgencyStatistics,
  saveUniversityForms,
  getUniversityForm
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register/student', registerStudent);
router.post('/register/agency', registerAgency);
router.post('/login', login);

// Protected routes (authentication required)
router.get('/profile', authenticate, getProfile);
router.post('/agency/services', authenticate, saveAgencyServices);
router.post('/agency/statistics', authenticate, saveAgencyStatistics);
router.post('/agency/forms', authenticate, saveUniversityForms);
router.get('/agency/forms', authenticate, getUniversityForm);

module.exports = router;
