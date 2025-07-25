const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');

// Admin routes
router.get('/calendar/admin', isAuthenticated, authorizeRoles('admin'), calendarController.adminView);
router.get('/calendar/admin/create', isAuthenticated, authorizeRoles('admin'), calendarController.createTimetableForm);
router.post('/calendar/admin/create', isAuthenticated, authorizeRoles('admin'), calendarController.createTimetableEntry);
router.get('/calendar/edit/:id', isAuthenticated, authorizeRoles('admin'), calendarController.editForm);
router.post('/calendar/edit/:id', isAuthenticated, authorizeRoles('admin'), calendarController.updateEntry);
router.post('/calendar/delete/:id', isAuthenticated, authorizeRoles('admin'), calendarController.deleteEntry);


// Teacher route
router.get('/calendar/teacher', isAuthenticated, authorizeRoles('teacher'), calendarController.teacherView);

// Student route
router.get('/calendar/student', isAuthenticated, authorizeRoles('student'), calendarController.studentView);

module.exports = router;
