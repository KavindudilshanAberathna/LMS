const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const SubjectAssignment = require('../models/SubjectAssignment');
const upload = require('../config/multer');
const SubjectContent = require('../models/SubjectContent');
const fs = require('fs');
const path = require('path');


// Student Dashboard
router.get('/student', isAuthenticated, authorizeRoles('student'), async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (user) {
      res.render('dashboard/student', { user });
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading student dashboard");
  }
});

// Teacher Dashboard
router.get('/teacher', isAuthenticated, authorizeRoles('teacher'), async (req, res) => {
  try {
    const teacherId = req.session.user._id;

    const assignments = await SubjectAssignment.find({ teacher: teacherId }).sort({ grade: 1 });

    res.render('dashboard/teacher', {
      user: req.session.user,
      assignments
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading teacher dashboard');
  }
});

// Teacher subject overview
router.get('/teacher/subject/:subjectName', isAuthenticated, authorizeRoles('teacher'), async (req, res) => {
  const { subjectName } = req.params;
  const grade = parseInt(req.query.grade);

  try {
    const assignment = await SubjectAssignment.findOne({
      teacher: req.session.user._id,
      subject: subjectName,
      grade
    });

    if (!assignment) {
      req.flash('error_msg', 'Subject not assigned to you.');
      return res.redirect('/dashboard/teacher');
    }

    const students = await User.find({ role: 'student', className: new RegExp(`Grade ${grade}`) });

    // ✅ Add this to fetch subject content
    
    const contents = await SubjectContent.find({
      subject: subjectName,
      grade: grade,
      teacher: req.session.user._id
    }).sort({ createdAt: -1 });

    res.render('teacher/teacher-subject-overview', {
      subject: subjectName,
      grade,
      assignedAt: assignment.assignedAt,
      students,
      contents // ✅ Pass it to EJS
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading subject overview');
  }
});

// POST to add content
router.post('/teacher/subject/:subjectName/content', isAuthenticated, authorizeRoles('teacher'), upload.single('file'), async (req, res) => {
  const { subjectName } = req.params;
  const grade = parseInt(req.query.grade, 10); // ✅ Use query instead of body

  if (isNaN(grade)) {
    req.flash('error_msg', 'Invalid grade provided.');
    return res.redirect('back');
  }

  
  const { title, description, type, url, content } = req.body;

  try {
    const newContent = new SubjectContent({
      teacher: req.session.user._id,
      subject: subjectName,
      grade,
      title,
      description,
      type,
      url: type === 'url' ? url : null,
      content: content || '',
      filePath: req.file
      ? req.file.path.replace(/^public[\\/]/, '').replace(/\\/g, '/')
      : null,
      createdAt: new Date()
    });

    await newContent.save();
    res.redirect(`/dashboard/teacher/subject/${subjectName}?grade=${grade}`);
  } catch (err) {
    console.error('Error saving content:', err);
    req.flash('error_msg', 'Failed to save content.');
    res.redirect('back');
  }
});

// DELETE content
router.post('/teacher/subject/:subjectName/content/:id/delete', isAuthenticated, authorizeRoles('teacher'), async (req, res) => {
  const { subjectName, id } = req.params;
  const { grade } = req.query;

  try {
    await SubjectContent.findOneAndDelete({ _id: id, teacher: req.session.user._id });
    req.flash('success_msg', 'Content deleted successfully.');
    res.redirect(`/dashboard/teacher/subject/${subjectName}?grade=${grade}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting content.');
    res.redirect('back');
  }
});

// GET Edit Content Page
router.get('/teacher/subject/:subjectName/content/:id/edit', isAuthenticated, authorizeRoles('teacher'), async (req, res) => {
  const { subjectName, id } = req.params;
  const { grade } = req.query;

  try {
    const content = await SubjectContent.findOne({ _id: id, teacher: req.session.user._id });
    if (!content) {
      req.flash('error_msg', 'Content not found.');
      return res.redirect(`/dashboard/teacher/subject/${subjectName}?grade=${grade}`);
    }

    res.render('teacher/edit-subject-content', { subjectName, grade, content });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading edit page.');
  }
});

// POST update content
router.post('/teacher/subject/:subjectName/content/:id/edit', isAuthenticated, authorizeRoles('teacher'), upload.single('file'), async (req, res) => {
  const { subjectName, id } = req.params;
  const { title, description, type, url } = req.body;

  try {
    const content = await SubjectContent.findOne({ _id: id, teacher: req.session.user._id });
    if (!content) {
      req.flash('error_msg', 'Content not found.');
      return res.redirect('back');
    }

    // If new file uploaded, delete the old one
    if (req.file && content.filePath) {
      const oldPath = path.join(__dirname, '../public', content.filePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Update content
    content.title = title;
    content.content = description;
    content.type = type;
    content.url = type === 'url' ? url : null;
    if (req.file) content.filePath = req.file.path.replace(/^public[\\/]/, '');

    await content.save();

    req.flash('success_msg', 'Content updated successfully.');

    // ✅ Redirect with grade from content (guaranteed)
    res.redirect(`/dashboard/teacher/subject/${subjectName}?grade=${content.grade}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating content.');
    res.redirect('back');
  }
});

// Parent Dashboard
router.get('/parent', isAuthenticated, authorizeRoles('parent'), (req, res) => {
  res.render('dashboard/parent', { user: req.session.user });
});

// Admin Dashboard
router.get('/admin', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }); // Fetch all teachers
    res.render('dashboard/admin', {
      user: req.session.user,
      teachers // <--- Make sure this is passed
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading admin dashboard");
  }
});


module.exports = router;
