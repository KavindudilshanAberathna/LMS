const Timetable = require('../models/Timetable');
const User = require('../models/User');
const Subject = require('../models/Subject');

// Timeslot map
const timeSlots = {
  1: '7:50 - 8:30 am',
  2: '8:30 - 9:10 am',
  3: '9:10 - 9:50 am',
  4: '9:50 - 10:30 am',
  5: '10:50 - 11:30 am',
  6: '11:30 - 12:10 pm',
  7: '12:10 - 12:50 pm',
  8: '12:50 - 1:30 pm'
};

exports.createTimetableForm = async (req, res) => {
  const teachers = await User.find({ role: 'teacher' });
  const subjects = await Subject.find();
  

  res.render('calendar/admin/create', { teachers, subjects });
};

exports.createTimetableEntry = async (req, res) => {
  try {
    const { grade, stream, day, period, subject, teacher } = req.body;
    const gradeInt = parseInt(grade);
    const periodInt = parseInt(period);
    const finalStream = (gradeInt === 12 || gradeInt === 13) ? stream : undefined;

    // Check if teacher is already assigned for the same day and period
    const conflict = await Timetable.findOne({
      teacher,
      day,
      period: periodInt
    }).populate('teacher');

    if (conflict) {
      // Teacher conflict exists, reload form with warning message
      const teachers = await User.find({ role: 'teacher' });
      const subjects = await Subject.find();

      return res.render('calendar/admin/create', {
        teachers,
        subjects,
        errorMessage: `Teacher ${conflict.teacher.fullName} is already assigned to another class on ${day} period ${periodInt}.`
      });
    }

    // No conflict, create timetable entry
    await Timetable.create({
      grade: gradeInt,
      stream: finalStream,
      day,
      period: periodInt,
      subject,
      teacher
    });

    res.redirect('/calendar/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to create timetable entry");
  }
};



exports.adminView = async (req, res) => {
  try {
    const entries = await Timetable.find({})
      .populate('subject')   // populate subject object
      .populate('teacher');  // populate teacher object

    const timeSlots = {
      1: "7:50 - 8:30 AM",
      2: "8:30 - 9:10 AM",
      3: "9:10 - 9:50 AM",
      4: "9:50 - 10:30 AM",
      5: "10:50 - 11:30 AM",
      6: "11:30 AM - 12:10 PM",
      7: "12:10 - 12:50 PM",
      8: "12:50 - 1:30 PM"
    };

    res.render("calendar/admin", { entries, timeSlots });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading admin timetable view");
  }
};

exports.editForm = async (req, res) => {
  try {
    const entry = await Timetable.findById(req.params.id)
      .populate('subject')
      .populate('teacher');

    if (!entry) {
      return res.status(404).send("Timetable entry not found");
    }

    const subjects = await Subject.find();
    const teachers = await User.find({ role: 'teacher' });

    const timeSlots = {
      1: "7.50 - 8.30 am",
      2: "8.30 - 9.10 am",
      3: "9.10 - 9.50 am",
      4: "9.50 - 10.30 am",
      5: "10.50 - 11.30 am",
      6: "11.30 am - 12.10 pm",
      7: "12.10 - 12.50 pm",
      8: "12.50 - 1.30 pm"
    };

    res.render('calendar/edit', { entry, subjects, teachers, timeSlots });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};


exports.updateEntry = async (req, res) => {
  const { grade, stream, day, period, subject, teacher } = req.body;
  await Timetable.findByIdAndUpdate(req.params.id, {
    grade, stream, day, period, subject, teacher,
  });
  res.redirect('/calendar/admin');
};

exports.deleteEntry = async (req, res) => {
  await Timetable.findByIdAndDelete(req.params.id);
  res.redirect('/calendar/admin');
};

exports.studentView = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user.className) {
      return res.status(400).send("Student className not defined");
    }

    // Extract grade number from "Grade 8"
    const match = user.className.match(/\d+/);
    if (!match) {
      return res.status(400).send("Invalid className format");
    }

    const grade = parseInt(match[0]); // e.g., "Grade 8" → 8
    const stream = (grade >= 12 && user.stream) ? user.stream : null;

    const filter = { grade };
    if (stream) filter.stream = stream;

    const timetable = await Timetable.find(filter)
      .populate('subject')
      .populate('teacher')
      .sort({ day: 1, period: 1 });

    const timeSlots = {
      1: "7.50 - 8.30 am",
      2: "8.30 - 9.10 am",
      3: "9.10 - 9.50 am",
      4: "9.50 - 10.30 am",
      5: "10.50 - 11.30 am",
      6: "11.30 am - 12.10 pm",
      7: "12.10 - 12.50 pm",
      8: "12.50 - 1.30 pm"
    };

    res.render('calendar/student', { timetable, timeSlots });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};


exports.teacherView = async (req, res) => {
  try {
    const user = req.session.user; // assuming user session contains _id for teacher

    if (!user._id) {
      return res.status(400).send("Teacher ID not found");
    }

    const timetable = await Timetable.find({ teacher: user._id })
      .populate('subject')
      .populate('teacher')
      .sort({ day: 1, period: 1 });

    const timeSlots = {
      1: "7.50 - 8.30 am",
      2: "8.30 - 9.10 am",
      3: "9.10 - 9.50 am",
      4: "9.50 - 10.30 am",
      5: "10.50 - 11.30 am",
      6: "11.30 am - 12.10 pm",
      7: "12.10 - 12.50 pm",
      8: "12.50 - 1.30 pm"
    };

    res.render('calendar/teacher', { timetable, timeSlots });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

