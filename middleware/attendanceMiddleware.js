const User = require('../models/User');
const SubjectAssignment = require('../models/SubjectAssignment');

// For teacher: check if teacher teaches the subject and student is assigned to it
exports.validateTeacherAttendance = async (req, res, next) => {
  const { student: studentId, subject } = req.body;
  const teacherId = req.session.user._id;

  try {
    // Check teacher assigned to the subject
    const teacherAssigned = await SubjectAssignment.findOne({
      teacher: teacherId,
      subject
    });
    if (!teacherAssigned) {
      return res.status(403).send('You are not assigned to this subject');
    }

    // Check student assigned to the subject
    const student = await User.findById(studentId);
    if (!student) return res.status(404).send('Student not found');

    if (!student.subjects.includes(subject)) {
      return res.status(403).send('Student is not assigned to this subject');
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during validation');
  }
};

// For admin: no restrictions or add validation if you want
exports.validateAdminAttendance = async (req, res, next) => {
  // Optionally add validation here if needed
  next();
};
