const Message = require('../models/Message');
const User = require('../models/User');

exports.inbox = async (req, res) => {
  const userId = req.session.user._id;
  const messages = await Message.find({ receiver: userId }).populate('sender', 'fullName');
  res.render('messages/inbox', { user: req.session.user, messages });
};

exports.newMessageForm = async (req, res) => {
  const users = await User.find({ _id: { $ne: req.session.user._id } }, 'fullName role');
  res.render('messages/new', { user: req.session.user, users });
};

exports.sendMessage = async (req, res) => {
  const { receiver, content } = req.body;
  await Message.create({
    sender: req.session.user._id,
    receiver,
    content,
  });
  res.redirect('/messages');
};

exports.sentMessages = async (req, res) => {
  const userId = req.session.user._id;
  const sent = await Message.find({ sender: userId }).populate('receiver', 'fullName');
  res.render('messages/sent', { user: req.session.user, sent });
};

exports.getStudentDashboard = async (req, res) => {
  try {
    const inboxCount = await Message.countDocuments({ receiver: req.session.user._id, isRead: false });
    res.render('dashboard/student', { inboxCount, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};