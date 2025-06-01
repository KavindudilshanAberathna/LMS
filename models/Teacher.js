// Assuming you already have a User model
// Optional extension for teacher-specific data
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  qualifications: String,
  experience: String
});

module.exports = mongoose.model('TeacherProfile', teacherSchema);
