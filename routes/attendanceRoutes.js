const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');

// Show attendance mark form - only teacher & admin
router.get('/mark', isAuthenticated, authorizeRoles('teacher', 'admin'), attendanceController.getMarkAttendanceForm);

// Get students for grade & subject (AJAX) - only teacher & admin
router.get('/students', isAuthenticated, authorizeRoles('teacher', 'admin'), attendanceController.getStudentsForAttendance);

// Submit attendance (expects JSON) - only teacher & admin
router.post('/mark', isAuthenticated, authorizeRoles('teacher', 'admin'), express.json(), attendanceController.postMarkAttendance);

// Attendance history page
router.get('/history', isAuthenticated, authorizeRoles('teacher', 'admin'), attendanceController.getAttendanceHistory);

// attendance details
router.get('/details', attendanceController.getAttendanceDetails);

// Student see attendance
router.get('/my-attendance', isAuthenticated, authorizeRoles('student'), attendanceController.getStudentAttendance);

module.exports = router;
