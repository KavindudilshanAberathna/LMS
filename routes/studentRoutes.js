const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { getSubjectsForGrade } = require('../utils/subjectAssigner');
const SubjectAssignment = require('../models/SubjectAssignment');
const SubjectContent = require('../models/SubjectContent');

// GET /student/subjects
router.get('/subjects', isAuthenticated, authorizeRoles('student'), async (req, res) => {
  try {
    const student = await User.findById(req.session.user._id);

    const grade = parseInt(student.className.split(' ')[1]);
    const stream = student.stream;

    const { common, optional } = getSubjectsForGrade(grade, stream);

    const assignedSubjects = student.subjects || [];
    const selectedOptionals = student.optionalSubjects || [];

    const optionalSubjects = optional.filter(
      sub => !selectedOptionals.includes(sub)
    );

    res.render('student/subjects', {
      assignedSubjects,
      optionalSubjects,
      student
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load subjects.');
    res.redirect('/dashboard/student');
  }
});

// GET - Show available optional subjects
router.get('/subjects/enroll', isAuthenticated, authorizeRoles('student'), async (req, res) => {
  const student = await User.findById(req.session.user._id);

  const grade = parseInt(student.className.split(' ')[1]);
  const stream = student.stream;

  const { optional } = getSubjectsForGrade(grade, stream);

  // Remove already enrolled optional subjects
  const availableSubjects = optional.filter(sub => !student.optionalSubjects.includes(sub));

  res.render('student/enrollSubjects', {
    availableSubjects,
    enrolled: student.optionalSubjects,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
});

// POST: Enroll optional subjects
router.post('/subjects/enroll', isAuthenticated, authorizeRoles('student'), async (req, res) => {
  const selectedSubjects = req.body.optionalSubjects;

  try {
    const student = await User.findById(req.session.user._id);
    const grade = parseInt(student.className.split(' ')[1]);

    const selectedArray = Array.isArray(selectedSubjects)
      ? selectedSubjects
      : selectedSubjects ? [selectedSubjects] : [];

    if ((grade === 10 || grade === 11) && selectedArray.length !== 3) {
      req.flash('error_msg', 'You must select exactly 3 optional subjects.');
      return res.redirect('/dashboard/student/subjects');
    }

// Save optionals & update full subject list
student.optionalSubjects = selectedArray;
student.subjects = [...new Set([...student.subjects, ...selectedArray])];
await student.save();

    req.flash('success_msg', 'Optional subjects enrolled successfully.');
    res.redirect('/dashboard/student/subjects');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to enroll in subjects.');
    res.redirect('/dashboard/student/subjects');
  }
});

// Route to handle stream selection for Grade 12 students
router.post('/stream/select', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { stream } = req.body;

    if (!stream) {
      return res.status(400).send("Stream is required.");
    }

    const student = await User.findById(userId);
    if (!student) return res.status(404).send("Student not found");

    student.stream = stream;
    await student.save();

    res.redirect('/dashboard/student/subjects');
  } catch (err) {
    console.error('Error selecting stream:', err);
    res.status(500).send('Server error');
  }
});

// Subject Overview Page
router.get('/subject/:subjectName', isAuthenticated, authorizeRoles('student'), async (req, res) => {
  try {
    const subjectName = req.params.subjectName;
    const student = await User.findById(req.session.user._id);

    if (!student || !student.className) {
      req.flash('error_msg', 'Student class info not found.');
      return res.redirect('/dashboard/student');
    }

    // Extract numeric grade from className, e.g., "Grade 10" → 10
    const grade = parseInt(student.className.split(' ')[1]);

    // Find teacher assignments
    const assignments = await SubjectAssignment.find({ subject: subjectName, grade })
      .populate('teacher', 'fullName email');

    // Load subject contents added by teachers
    const contents = await SubjectContent.find({
      subject: subjectName,
      grade
    }).sort({ createdAt: -1 });

    res.render('student/subject-overview', {
      subjectName,
      grade,
      assignments,
      contents // <-- New
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading subject overview');
  }
});



module.exports = router;
