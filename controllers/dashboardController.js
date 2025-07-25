const Message = require('../models/Message');

exports.getStudentDashboard = async (req, res) => {
  try {
    const inboxCount = await Message.countDocuments({
      receiver: req.session.user._id,
      isRead: false
    });

    res.render('dashboard/student', {
      user: req.session.user,
      inboxCount // 👈 This makes inboxCount available in student.ejs
    });
  } catch (error) {
    console.error('Error loading student dashboard:', error);
    res.status(500).send('Server error');
  }
};
