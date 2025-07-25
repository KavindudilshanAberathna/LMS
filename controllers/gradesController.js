const User = require('../models/User');
const SubjectAssignment = require('../models/SubjectAssignment');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');

exports.getGradeEntryForm = async (req, res) => {
  try {
    const user = req.session.user;
    const { grade, subject } = req.query;

    let assignedGrades = [];
    let assignedSubjects = [];
    let students = [];

    // Get assigned subjects and grades
    if (user.role === 'teacher') {
      const assignments = await SubjectAssignment.find({ teacher: user._id });

      assignedGrades = [...new Set(assignments.map(a => `Grade ${a.grade}`))];
      assignedSubjects = [...new Set(assignments.map(a => a.subject))];
    } else if (user.role === 'admin') {
      assignedGrades = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'];
      assignedSubjects = await SubjectAssignment.distinct('subject'); // All subjects in system
    }

    // Load students only if grade and subject selected
    if (grade && subject) {
      students = await User.find({
        role: 'student',
        className: grade,
        subjects:{ $in: [subject] }   // 'subjects' is an array in student model
      });
    }

    res.render('grades/entry', {
      assignedGrades,
      assignedSubjects,
      selectedGrade: grade || '',
      selectedSubject: subject || '',
      students,
    });
  } catch (error) {
    console.error('Error loading grade entry form:', error);
    res.status(500).send('Server error');
  }
};

exports.postGradeEntry = async (req, res) => {
  try {
    const { grade, subject, studentId, score, maxScore, term , comment } = req.body;
    const teacherId = req.session.user._id;

    if (!grade || !subject || !studentId || !score || !maxScore || !term) {
      return res.status(400).send('Missing required fields');
    }

    // Optional: Prevent duplicate entries for same student, subject, grade, and term
    const existing = await Grade.findOne({
      student: studentId,
      subject,
      grade: grade.replace('Grade ', ''),
      term,
      comment
    });

    if (existing) {
      // Update existing grade
      existing.score = score;
      existing.maxScore = maxScore;
      existing.teacher = teacherId;
      await existing.save();
    } else {
      // Create new grade entry
      const newGrade = new Grade({
        student: studentId,
        subject,
        grade: grade.replace('Grade ', ''),
        term,
        score,
        maxScore,
        teacher: teacherId,
        comment,
      });
      await newGrade.save();
    }

    // Redirect back to the grade entry page for the same subject/grade
    return res.redirect(`/grades/entry?grade=${grade}&subject=${subject}`);

  } catch (error) {
    console.error('Error saving grade:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.getStudentReport = async (req, res) => {
  try {
    const studentId = req.session.user._id;

    const grades = await Grade.find({ student: studentId }).sort({ date: -1 });

    res.render('grades/report', {
      user: req.session.user,
      grades
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

exports.getTeacherGrades = async (req, res) => {
  try {
    const teacherId = req.session.user._id;

    // Get all subject assignments for the teacher
    const assignments = await SubjectAssignment.find({ teacher: teacherId });

    // Build a query to fetch only relevant grades
    const matchConditions = assignments.map(a => ({
      subject: a.subject,
      grade: a.grade.toString(),
    }));

    const allGrades = [];

    for (const condition of matchConditions) {
      const grades = await Grade.find(condition)
        .populate('student', 'fullName')
        .sort({ createdAt: -1 });

      allGrades.push({
        grade: condition.grade,
        subject: condition.subject,
        grades
      });
    }

    res.render('grades/myStudents', { allGrades });
  } catch (err) {
    console.error('Error fetching teacher grades:', err);
    res.status(500).send('Server Error');
  }
};

exports.getAllGradesAdmin = async (req, res) => {
  try {
    // Get all grades from DB
    const grades = await Grade.find()
      .populate('student', 'fullName className')
      .populate('teacher','fullName')
      .sort({ date: -1 });

    // Group by Grade and Subject
    const groupedGrades = {};

    grades.forEach(g => {
      const gradeName = g.grade;
      const subject = g.subject;
      const key = `${gradeName}_${subject}`;

      if (!groupedGrades[key]) {
        groupedGrades[key] = {
          grade: gradeName,
          subject,
          grades: []
        };
      }

      groupedGrades[key].grades.push(g);
    });

    res.render('grades/allStudents', {
      groupedGrades: Object.values(groupedGrades)
    });
  } catch (err) {
    console.error('Error loading admin grades:', err);
    res.status(500).send('Server Error');
  }
};

exports.getEditGradeForm = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'name')
      .populate('teacher', 'name');

    if (!grade) return res.status(404).send('Grade not found');

    res.render('grades/edit', { grade });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).send('Server error');
  }
};

exports.postEditGrade = async (req, res) => {
  const { score, maxScore, term } = req.body;

  try {
    await Grade.findByIdAndUpdate(req.params.id, {
      score,
      maxScore,
      term,
    });

    res.redirect('/grades/all');
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).send('Server error');
  }
};

exports.deleteGrade = async (req, res) => {
  try {
    await Grade.findByIdAndDelete(req.params.id);
    res.redirect('/grades/all');
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).send('Server error');
  }
};
