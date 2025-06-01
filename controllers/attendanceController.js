const TeacherAttendance = require('../models/TeacherAttendance');
const User = require('../models/User');
const SubjectAssignment = require('../models/SubjectAssignment');
const StudentAttendance = require('../models/StudentAttendance');
const Subject = require('../models/Subject');


// Teacher attendance mark
exports.viewOwnAttendance = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user || !user._id) {
      return res.status(401).send("Unauthorized. User session not found.");
    }

    const attendance = await TeacherAttendance.find({ teacher: user._id }).populate('teacher');
    res.render('teacher/attendance', { attendance });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

exports.getMarkAttendanceForm = async (req, res) => {
  try {
    const user = req.session.user;
    const { grade, subject, date } = req.query;

    let assignedSubjects = [];
    let assignedGrades = [];
    let students = [];

    if (user.role === 'teacher') {
      const assignments = await SubjectAssignment.find({ teacher: user._id });
      assignedGrades = [...new Set(assignments.map(a => `Grade ${a.grade}`))];
      assignedSubjects = [...new Set(assignments.map(a => a.subject))];
    } else if (user.role === 'admin') {
      assignedGrades = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'];
      assignedSubjects = await Subject.find().distinct('name');
    }

    // Only load students if grade and subject selected
    if (grade && subject) {
      // Note: className stored like 'Grade 8' in your User schema
      students = await User.find({ role: 'student', className: grade, subjects: subject });
    }

    res.render('attendance/mark', {
      user,
      assignedGrades,
      assignedSubjects,
      selectedGrade: grade || '',
      selectedSubject: subject || '',
      date: date || new Date().toISOString().split('T')[0],
      students,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Load students for selected subject/grade
exports.getStudentsForAttendance = async (req, res) => {
  try {
    const { grade, subject } = req.query;
    if (!grade || !subject) {
      return res.status(400).json({ error: "Grade and subject are required" });
    }

    const students = await User.find({
      role: 'student',
      className: `Grade ${grade}`,  // Prefix added here
      subjects: subject
    }).lean();

    console.log(`Students found for grade Grade ${grade}, subject ${subject}:`, students.length);

    res.json(students);
  } catch (err) {
    console.error('Failed to load students:', err);
    res.status(500).json({ error: 'Failed to load students' });
  }
};

// Submit attendance
exports.postMarkAttendance = async (req, res) => {
  try {
    const { date, grade, subject } = req.body;

    // Extract attendance entries from req.body keys
    const attendanceEntries = [];

    for (const key in req.body) {
      if (key.startsWith('attendanceStatus_')) {
        const studentId = key.split('_')[1];
        const status = req.body[key];
        attendanceEntries.push({
          student: studentId,
          subject,
          grade: grade.replace('Grade ', ''),
          date: new Date(date),
          status,
        });
      }
    }

    // Save or update attendance records
    for (const entry of attendanceEntries) {
      await StudentAttendance.findOneAndUpdate(
        {
          student: entry.student,
          subject: entry.subject,
          grade: entry.grade,
          date: entry.date,
        },
        entry,
        { upsert: true, new: true }
      );
    }

    // Redirect to attendance history page after success
    return res.redirect('/attendance/history');

  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).send('Error saving attendance');
  }
};

// attendance History
exports.getAttendanceHistory = async (req, res) => {
  try {
    // Aggregate attendance records grouping by date, subject, grade
    const attendanceGroups = await StudentAttendance.aggregate([
      {
        $group: {
          _id: {
            date: "$date",
            subject: "$subject",
            grade: "$grade",
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": -1 } // latest dates first
      }
    ]);

    // Format date string for rendering (optional)
    const formattedGroups = attendanceGroups.map(group => {
      return {
        date: group._id.date.toISOString().split('T')[0],
        subject: group._id.subject,
        grade: group._id.grade,
        count: group.count,
      };
    });

    res.render('attendance/history', { attendanceGroups: formattedGroups, user: req.session.user });
  } catch (error) {
    console.error('Error loading attendance history:', error);
    res.status(500).send('Error loading attendance history');
  }
};

//attendance Details
exports.getAttendanceDetails = async (req, res) => {
  try {
    const { date, grade, subject } = req.query;
    if (!date || !grade || !subject) {
      return res.status(400).send('Missing parameters');
    }

    // Convert date string to Date object (ignore time for matching)
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Fetch attendance records matching date, grade, subject
    const records = await StudentAttendance.find({
      date: { $gte: start, $lte: end },
      grade,
      subject,
    }).populate('student', 'fullName className'); // populate student info

    res.render('attendance/details', {
      user: req.session.user,
      records,
      date,
      grade,
      subject,
    });
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Student Can see their own attendance
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.session.user._id;

    // Find all attendance records for this student
    const records = await StudentAttendance.find({ student: studentId })
      .sort({ date: -1 });

    res.render('attendance/studentAttendance', { records });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).send('Failed to load attendance data.');
  }
};


