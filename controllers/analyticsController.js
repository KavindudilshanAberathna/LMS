const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const User = require('../models/User');
const mongoose = require('mongoose');
const Attendance = require('../models/StudentAttendance');

exports.getStudentPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Fetch grades for the student
    const grades = await Grade.find({ student: studentId }).populate('subject');

    // Group grades by subject and calculate average
    const subjectScores = {};
    grades.forEach(grade => {
      const subjectName = grade.subject.name;
      if (!subjectScores[subjectName]) subjectScores[subjectName] = [];
      subjectScores[subjectName].push(grade.score);
    });

    const performanceData = Object.keys(subjectScores).map(subject => {
      const scores = subjectScores[subject];
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      return { subject, average: average.toFixed(2) };
    });

    res.render('analytics/performance', {
      performanceData,
      studentId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getStudentList = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('fullName _id');
    res.render('analytics/studentList', { students });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getAttendanceInsights = async (req, res) => {
  const { studentId } = req.params;

  // Get current month range
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get all attendance records for this student in the current month
  const attendanceRecords = await Attendance.find({
    student: studentId,
    date: { $gte: firstDay, $lte: lastDay }
  }).populate('subject');

  // Group by subject
  const subjectAttendance = {};
  attendanceRecords.forEach(record => {
    const subjectName = record.subject?.name || 'Unknown';
    if (!subjectAttendance[subjectName]) {
      subjectAttendance[subjectName] = { total: 0, present: 0 };
    }
    subjectAttendance[subjectName].total++;
    if (record.status === 'present') {
      subjectAttendance[subjectName].present++;
    }
  });

  // Prepare analytics
  const insights = Object.entries(subjectAttendance).map(([subject, stats]) => {
    const percent = (stats.present / stats.total) * 100;
    return {
      subject,
      present: stats.present,
      total: stats.total,
      percent: percent.toFixed(2),
      atRisk: percent < 75
    };
  });

  const student = await User.findById(studentId).select('name');

  res.render('analytics/attendanceInsights', { student, insights });
};