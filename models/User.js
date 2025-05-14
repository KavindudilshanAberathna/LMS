const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'admin'],
    required: true,
    ref: 'User'
  },
  fullName: { 
    type: String,
     required: true 
  },
  dob: {
    type: Date,
  },
  gender:{
    type:String,
  },
  parentName: {
    type: String,
    required: false
  },
  contact: {
    type: String,
    required: false
  },
  email: { 
    type: String,
    required: true,
    unique: true 
  },
  className: {
    type: String,
  },
  password: { 
    type: String,
    required: true 
  },
  profilePicture: String,
  childEmail: { type: String 
  },// Only for parents
  stream: String,
  optionalSubjects: [String], 
  subjects: [String]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
