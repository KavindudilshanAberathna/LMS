const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);
