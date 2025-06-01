const express = require('express');
const router = express.Router();
const gradesController = require('../controllers/gradesController');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/grades/entry', isAuthenticated, authorizeRoles('teacher', 'admin'), gradesController.getGradeEntryForm);

// You'll also need a POST route to save the grades:
router.post('/grades/entry', isAuthenticated, authorizeRoles('teacher', 'admin'), gradesController.postGradeEntry);

router.get('/grades/report', isAuthenticated, authorizeRoles('student'), gradesController.getStudentReport);

router.get('/grades/mystudents', isAuthenticated, authorizeRoles('teacher'), gradesController.getTeacherGrades);

router.get('/grades/all', isAuthenticated, authorizeRoles('admin', 'teacher'), gradesController.getAllGradesAdmin);
router.get('/grades/edit/:id', isAuthenticated, authorizeRoles('admin'), gradesController.getEditGradeForm);
router.post('/grades/edit/:id', isAuthenticated, authorizeRoles('admin'), gradesController.postEditGrade);
router.post('/grades/delete/:id', isAuthenticated, authorizeRoles('admin'), gradesController.deleteGrade);


module.exports = router;
