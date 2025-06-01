const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/performance/:studentId', isAuthenticated, authorizeRoles('admin', 'teacher'), analyticsController.getStudentPerformance);

router.get('/students', isAuthenticated, authorizeRoles('admin', 'teacher'), analyticsController.getStudentList);

router.get('/attendance/:studentId', isAuthenticated, authorizeRoles('admin', 'teacher'), analyticsController.getAttendanceInsights);


module.exports = router;