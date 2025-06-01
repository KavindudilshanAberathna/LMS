const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const SubjectAssignment = require('../models/SubjectAssignment');
const { getAllSubjects } = require('../utils/subjectAssigner');
const allSubjects = require('../utils/subjectAssigner');

// View all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, name } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (name) {
      filter.fullName = { $regex: name, $options: 'i' };
    }

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.render('admin/users', {
      users,
      filters: { role: role || 'all', name: name || '' },
      pagination: {
        currentPage: page,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Show edit form
exports.editUserForm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).send('User not found');
    res.render('admin/editUser', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      gender,
      parentName,
      contact,
      email,
      className,
      role,
      childEmail,
      stream,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');

    // Update basic fields
    user.fullName = fullName;
    user.dob = dob;
    user.gender = gender;
    user.parentName = parentName;
    user.contact = contact;
    user.email = email;
    user.className = className;
    user.role = role;
    user.childEmail = childEmail;
    user.stream = stream;

    // Handle profile picture upload
    if (req.file) {
      // Delete old picture if exists
      const oldPath = path.join(__dirname, '..', 'public', user.profilePicture || '');
      if (user.profilePicture && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      user.profilePicture = 'uploads/' + req.file.filename;
    }

    await user.save();
    res.redirect('/dashboard/admin/users');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');

    // Delete profile picture if it exists
    const picturePath = path.join(__dirname, '..', 'public', user.profilePicture || '');
    if (user.profilePicture && fs.existsSync(picturePath)) {
      fs.unlinkSync(picturePath);
    }

    await User.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard/admin/users');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Show Add User Form
exports.addUserForm = (req, res) => {
  res.render('admin/addUser');
};

// Create User
exports.createUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      contact,
      childEmail
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.send('User with this email already exists.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role,
      contact,
      childEmail: role === 'parent' ? childEmail : undefined,
      profilePicture: req.file ? req.file.path : undefined
    });

    await newUser.save();
    res.redirect('/dashboard/admin/users');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// View all subject assignments (grouped by subject + grade)
exports.getAllSubjectAssignments = async (req, res) => {
  try {
    const allSubjects = getAllSubjects(); // ✅ from your utility

    const assignments = await SubjectAssignment.find()
      .populate('teacher', 'fullName email')
      .lean();

    const subjectsWithTeachers = allSubjects.map(subjectName => {
      const subjectAssignments = assignments
        .filter(a => a.subject === subjectName)
        .map(a => ({
           _id: a._id,
          teacher: a.teacher,
          grade: a.grade
        }));

      return {
        subject: subjectName,
        assignments: subjectAssignments
      };
    });

    res.render('admin/subjects', { subjectsWithTeachers });

  } catch (error) {
    console.error('Error fetching subject assignments:', error);
    res.status(500).send('Server Error');
  }
};

// edit subject assignment
exports.getEditSubjectPage = async (req, res) => {
  const subjectName = req.params.subject;

  try {
    const teachers = await User.find({ role: 'teacher' }).lean();
    const assignments = await SubjectAssignment.find({ subject: subjectName }).populate('teacher', 'fullName email').lean();

    const assignedTeacherIds = assignments.map(a => a.teacher._id.toString());

    res.render('admin/editSubject', {
      subject: subjectName,
      teachers,
      assignedTeacherIds
    });
  } catch (error) {
    console.error('Error loading edit subject page:', error);
    res.status(500).send('Server Error');
  }
};

//update subject
exports.updateSubjectAssignments = async (req, res) => {
  const subject = req.params.subject;
  let teacherIds = req.body.teachers;
  let grade = req.body.grade;

  if (!grade || (grade !== 'All' && isNaN(parseInt(grade)))) {
    console.error('Invalid grade value received:', grade);
    return res.status(400).send('Invalid grade value');
  }

  grade = grade === 'All' ? 0 : parseInt(grade);

  // Normalize teacherIds to always be an array
  if (!teacherIds) {
    teacherIds = [];
  } else if (!Array.isArray(teacherIds)) {
    teacherIds = [teacherIds];
  }

  try {
    // Remove existing assignments for this subject
    await SubjectAssignment.deleteMany({ subject });

    // Only insert if there are any selected teachers
    if (teacherIds.length > 0) {
      const newAssignments = teacherIds.map(teacherId => ({
        subject,
        teacher: teacherId,
        grade // ✅ use parsed grade here
      }));

      const validAssignments = newAssignments.filter(a => a.teacher && a.grade !== null);

      if (validAssignments.length > 0) {
        await SubjectAssignment.insertMany(validAssignments);
      }
    }

    res.redirect('/dashboard/admin/subjects');
  } catch (error) {
    console.error('Error updating subject assignments:', error);
    res.status(500).send('Server Error');
  }
};

// Assign teachers to a subject
exports.assignTeachersToSubject = async (req, res) => {
  try {
    const { subject, grade, teacherIds } = req.body;

    const ids = Array.isArray(teacherIds) ? teacherIds : [teacherIds];

    // Remove previous assignments for this subject & grade
    await SubjectAssignment.deleteMany({ subject, grade });

    // Add new assignments
    const newAssignments = ids.map(teacher => ({
      teacher,
      subject,
      grade
    }));

    await SubjectAssignment.insertMany(newAssignments);

    res.redirect('/dashboard/admin/subjects');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error assigning teachers');
  }
};

// delete assigned subjects
exports.deleteAssignment = async (req, res) => {
  const assignmentId = req.params.id;

  try {
    await SubjectAssignment.findByIdAndDelete(assignmentId);
    res.redirect('/dashboard/admin/subjects');
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).send('Server Error');
  }
};

//edit assignment
exports.getEditAssignmentPage = async (req, res) => {
  const assignmentId = req.params.id;

  try {
    const assignment = await SubjectAssignment.findById(assignmentId)
      .populate('teacher', 'fullName email')
      .lean();

    const teachers = await User.find({ role: 'teacher' }).lean();

    if (!assignment) return res.status(404).send('Assignment not found');

    res.render('admin/editAssignment', {
      assignment,
      teachers,
    });
  } catch (err) {
    console.error('Error loading edit assignment page:', err);
    res.status(500).send('Server Error');
  }
};

// update Assignment
exports.updateAssignment = async (req, res) => {
  const assignmentId = req.params.id;
  const { teacherId, grade } = req.body;

  try {
    await SubjectAssignment.findByIdAndUpdate(assignmentId, {
      teacher: teacherId,
      grade: grade === 'All' ? 0 : parseInt(grade)
    });

    res.redirect('/dashboard/admin/subjects');
  } catch (err) {
    console.error('Error updating assignment:', err);
    res.status(500).send('Server Error');
  }
};

// GET form to add new assignment
exports.renderAddAssignmentForm = async (req, res) => {
  const subject = req.params.subject;
  const teachers = await User.find({ role: 'teacher' });

  res.render('admin/subjectAssignForm', {
    subject,
    teachers
  });
};

// POST form to handle new assignment
exports.handleAssignmentSubmit = async (req, res) => {
  const subject = req.params.subject;
  const grade = parseInt(req.body.grade);
  let teacherIds = req.body.teacherIds;

  try {
    if (!Array.isArray(teacherIds)) {
      teacherIds = [teacherIds];
    }

    for (let teacher of teacherIds) {
      await SubjectAssignment.create({
        teacher,
        subject,
        grade: parseInt(grade)
      });
    }

    res.redirect('/dashboard/admin/subjects');
  } catch (error) {
    console.error('Assignment Error:', error);
    res.status(500).send('Internal Server Error');
  }
};
