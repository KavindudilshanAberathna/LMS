const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const User = require('../models/User');
const TeacherAttendance = require('../models/TeacherAttendance');
const bcrypt = require('bcrypt');
const upload = require('../config/multer');
const { getSubjectsForGrade, getAllSubjects } = require('../utils/subjectAssigner');
const SubjectAssignment = require('../models/SubjectAssignment');
const adminController = require('../controllers/adminController');

// GET mark attendance page
router.get('/mark-attendance', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  const teachers = await User.find({ role: 'teacher' });
  res.render('attendance/mark-teacher', {
    teachers,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error')
  });
});

// POST mark attendance form
router.post('/mark-attendance', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const { teacherId, status, date } = req.body;

    if (!teacherId || !status || !date) {
      req.flash('error', 'Please provide all required fields.');
      return res.redirect('/dashboard/admin/mark-attendance');
    }

    // Normalize the selected date (midnight)
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Next day for range query
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check if attendance is already marked for this teacher on that date
    const alreadyMarked = await TeacherAttendance.findOne({
      teacher: teacherId,
      date: {
        $gte: selectedDate,
        $lt: nextDay
      }
    });

    if (alreadyMarked) {
      req.flash('error', 'Attendance already marked for this teacher on the selected date.');
      return res.redirect('/dashboard/admin/mark-attendance');
    }

    // Save the attendance
    await TeacherAttendance.create({
      teacher: teacherId,
      status,
      date: selectedDate
    });

    req.flash('success_msg', 'Attendance marked successfully.');
    res.redirect('/dashboard/admin/attendance-reports');

  } catch (err) {
    console.error('Error marking attendance:', err);
    req.flash('error', 'Something went wrong while marking attendance.');
    res.redirect('/mark-attendance');
  }
});

// Get attendance reports
router.get('/attendance-reports', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const attendanceRecords = await TeacherAttendance.find()
      .populate('teacher', 'fullName')
      .sort({ date: -1 });

    // Group attendance by date (YYYY-MM-DD)
    const grouped = {};

    attendanceRecords.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(record);
    });

    res.render('attendance/attendance-reports', {
      groupedAttendance: grouped,
      success_msg: req.flash('success'),
      error_msg: req.flash('error')
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error fetching attendance reports');
    res.redirect('/dashboard/admin/');
  }
});

// Get Edit Attendance
router.get('/attendance/edit/:id', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const attendance = await TeacherAttendance.findById(req.params.id).populate('teacher');
    if (!attendance) {
      req.flash('error_msg', 'Attendance record not found.');
      return res.redirect('/dashboard/admin/attendance-reports');
    }
    res.render('attendance/edit-attendance', { attendance });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading edit page.');
    res.redirect('/dashboard/admin/attendance-reports');
  }
});

// Post Edit Attendance
router.post('/attendance/edit/:id', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  const { status, date } = req.body;
  try {
    await TeacherAttendance.findByIdAndUpdate(req.params.id, {
      status,
      date: new Date(date),
    });
    req.flash('success_msg', 'Attendance updated successfully.');
    res.redirect('/dashboard/admin/attendance-reports');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating attendance.');
    res.redirect('/dashboard/admin/attendance-reports');
  }
});

// Post Delete Attendance
router.post('/attendance/delete/:id', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    await TeacherAttendance.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Attendance deleted successfully.');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting attendance.');
  }
  res.redirect('/dashboard/admin/attendance-reports');
});

// Show the add student form (GET)
router.get('/add-student', isAuthenticated, authorizeRoles('admin'), (req, res) => {
  res.render('admin/addStudent', {
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
});

// Show the add student form (Post)
router.post('/add-student', isAuthenticated, authorizeRoles('admin'), upload.single('profilePicture'), async (req, res) => {
  const {
    fullName,
    dob,
    gender,
    parentName,
    contact,
    email,
    password,
    className,
    stream
  } = req.body;

  const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const existingStudent = await User.findOne({ email });
    if (existingStudent) {
      req.flash('error_msg', 'Student with this email already exists.');
      return res.redirect('/dashboard/admin/students');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const grade = parseInt(className.split(' ')[1]);

    const { getSubjectsForGrade } = require('../utils/subjectAssigner');
    const { common, optional } = getSubjectsForGrade(grade, stream);

    const newStudent = await User.create({
      fullName,
      dob,
      gender,
      parentName,
      contact,
      email,
      password: hashedPassword,
      role: 'student',
      className,
      stream,
      profilePicture,
      subjects: common,          // ✅ Assign default subjects
      optionalSubjects: []       // ✅ Student can select later
    });

    req.flash('success_msg', 'Student added successfully.');
    res.redirect('/dashboard/admin/students');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding student.');
    res.redirect('/add-student');
  }
});

// GET /admin/students
router.get('/students', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const gradeFilter = req.query.grade;

    const query = { role: 'student' };

    if (gradeFilter) {
      query.className = new RegExp(`^Grade ${gradeFilter}\\b`, 'i'); // Match "Grade 8", "Grade 8 A", etc.
    }

    const students = await User.find(query).sort({ createdAt: -1 });

    const groupedStudents = {};
    students.forEach(student => {
      const dateKey = student.createdAt.toISOString().split('T')[0];
      if (!groupedStudents[dateKey]) groupedStudents[dateKey] = [];
      groupedStudents[dateKey].push(student);
    });

    res.render('admin/students-list', { groupedStudents, selectedGrade: gradeFilter });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard/admin');
  }
});

// GET /edit-student/:id
router.get('/edit-student/:id', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    res.render('admin/editStudent', { student });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load student.');
    res.redirect('/students');
  }
});

// POST /edit-student/:id
router.post('/edit-student/:id', isAuthenticated, authorizeRoles('admin'), upload.single('profilePicture'), async (req, res) => {
  const {
    fullName,
    dob,
    gender,
    parentName,
    contact,
    email,
    className
  } = req.body;

  try {
    const student = await User.findById(req.params.id);
    if (!student) throw new Error('Student not found');

    // Update fields
    student.fullName = fullName;
    student.dob = dob;
    student.gender = gender;
    student.parentName = parentName;
    student.contact = contact;
    student.email = email;
    student.className = className;

    // Only update profilePicture if new file uploaded
    if (req.file) {
      student.profilePicture = `/uploads/${req.file.filename}`;
    }

    await student.save();
    req.flash('success_msg', 'Student updated successfully.');
    res.redirect('/dashboard/admin/students');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to update student.');
    res.redirect('/dashboard/admin/students');
  }
});

// GET /delete-student/:id
router.get('/delete-student/:id', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Student deleted.');
    res.redirect('/dashboard/admin/students');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting student.');
    res.redirect('/dashboard/admin/students');
  }
});

// view all users
router.get('/users', isAuthenticated, authorizeRoles('admin'), adminController.getAllUsers);

// edit all users
router.get('/users/edit/:id', isAuthenticated, authorizeRoles('admin'), adminController.editUserForm);

// update all users
router.post('/users/edit/:id', isAuthenticated, authorizeRoles('admin'), upload.single('profilePicture'), adminController.updateUser);

// delete all users
router.post('/users/delete/:id', isAuthenticated, authorizeRoles('admin'), adminController.deleteUser);

// add teacher or parent or user
router.get('/users/add', isAuthenticated, authorizeRoles('admin'), adminController.addUserForm);
router.post('/users/add', isAuthenticated, authorizeRoles('admin'), upload.single('profilePicture'), adminController.createUser);

//view all subjects with teachers
router.get('/subjects', isAuthenticated, authorizeRoles('admin'), adminController.getAllSubjectAssignments);
router.get('/subjects/edit/:subject', adminController.getEditSubjectPage);
router.post('/subjects/edit/:subject', adminController.updateSubjectAssignments);
router.post('/subjects/assign', isAuthenticated, authorizeRoles('admin'), adminController.assignTeachersToSubject);
router.post('/delete-subjects/:id', adminController.deleteAssignment);

// Get edit form for a specific assignment
router.get('/subjects/edit-assignment/:id', isAuthenticated, authorizeRoles('admin'), adminController.getEditAssignmentPage);

// Handle edit submission
router.post('/subjects/edit-assignment/:id', isAuthenticated, authorizeRoles('admin'), adminController.updateAssignment);

// Add new assignment form
router.get('/subjects/add-assignment/:subject', adminController.renderAddAssignmentForm);

// Handle form submission
router.post('/subjects/add-assignment/:subject', adminController.handleAssignmentSubmit);

module.exports = router;
