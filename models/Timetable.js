const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  grade: { type: Number, required: true },
  stream: { type: String },
  day: { type: String, required: true }, // e.g., "Monday"
  period: { type: Number, required: true }, // 1 to 8
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classroom: { type: String } // optional
});

module.exports = mongoose.model('Timetable', timetableSchema);
