const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const attendanceController = require('../controllers/attendanceController');

// view teacher Dashboard
router.post('/assign-subject', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    const { teacherId, subject, className, section } = req.body;
    await SubjectAllocation.create({ teacher: teacherId, subject, className, section });
    res.redirect('/dashboard/admin'); 
  });

// View Teacher own Attendance
router.get(
  '/attendance',
  isAuthenticated,
  authorizeRoles('teacher'),
  attendanceController.viewOwnAttendance
);

module.exports = router;

