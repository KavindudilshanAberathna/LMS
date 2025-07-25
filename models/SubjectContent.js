const mongoose = require('mongoose');

const subjectContentSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  grade: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content:{
    type: String,
  },
  type: {
    type: String,
    enum: ['text', 'announcement', 'syllabus', 'url'],
    required: true
  },
  url:{
    type: String
  },
  filePath :{
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SubjectContent', subjectContentSchema);
