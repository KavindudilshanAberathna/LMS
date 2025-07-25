const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const path = require('path');
const flash = require('connect-flash');

dotenv.config();
const app = express();

// Database
require('./config/db')();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Set up views
app.set('view engine', 'ejs');
app.set('views', './views');

// Routes
app.use('/', require('./routes/authRoutes'));
app.use('/uploads', express.static('uploads'));
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/dashboard', dashboardRoutes);
const adminRoutes = require('./routes/adminRoutes');
app.use('/dashboard/admin', adminRoutes);
const studentRoutes = require('./routes/studentRoutes');
app.use('/dashboard/student', studentRoutes);
const teacherRoutes = require('./routes/teacherRoutes');
app.use('/dashboard/teacher', teacherRoutes);
const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/attendance', attendanceRoutes);
const gradeRoutes = require('./routes/gradeRoutes');
app.use('/', gradeRoutes);
const messageRoutes = require('./routes/messageRoutes');
app.use('/', messageRoutes);
app.use('/analytics', require('./routes/analyticsRoutes'));
const calendarRoutes = require('./routes/calendarRoutes');
app.use('/', calendarRoutes);



// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
