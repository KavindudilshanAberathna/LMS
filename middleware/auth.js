exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access only' });
};

exports.isTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') return next();
  res.status(403).json({ message: 'Teacher access only' });
};

exports.isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') return next();
  res.status(403).json({ message: 'Student access only' });
};
