const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,  // prevents duplicate subjects by name
  },
  type: {
    type: String,
    enum: ['common', 'optional'],
    required: true,
  },
  grades: {
    type: [Number],  // list of grades this subject applies to
    required: true,
  },
  stream: {
    type: String, // null for no stream, or 'science', 'commerce', 'arts'
    default: null,
  },
});

module.exports = mongoose.model('Subject', SubjectSchema);