const express = require('express');
const router = express.Router();
const { saveAcademicInfo, getApplications, saveSelectedUniversity, getAgenciesByUniversity, sendAgencyRequest, getRequestStatus } = require('../controllers/applicationController');
const { authenticate } = require('../middleware/auth');

// POST /api/students/applications – save academic info (protected)
router.post('/', authenticate, saveAcademicInfo);

// GET /api/students/applications – list student's applications (protected)
router.get('/', authenticate, getApplications);

// GET /api/students/applications/agencies-by-university?university=<name> – fetch agencies for a university (protected)
router.get('/agencies-by-university', authenticate, getAgenciesByUniversity);

// PUT /api/students/applications/selected-university – save ML-selected university (protected)
router.put('/selected-university', authenticate, saveSelectedUniversity);

// POST /api/students/applications/send-request – send a visa request to a specific agency (protected)
router.post('/send-request', authenticate, sendAgencyRequest);

// GET /api/students/applications/request-status – get the latest request status for the student (protected)
router.get('/request-status', authenticate, getRequestStatus);

module.exports = router;
