const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.registerForm = (req, res) => {
  res.render('auth/register');
};

exports.register = async (req, res) => {
  const { role, fullName, email, password, childEmail } = req.body;
  const profilePicture = req.file ? req.file.filename : null;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      role,
      fullName,
      email,
      password: hashedPassword,
      profilePicture,
      childEmail: role === 'parent' ? childEmail : undefined,
    });

    await user.save();

    req.flash('success_msg', 'Registration successful! You can now login.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Email already exists or error saving user');
    res.redirect('/register');
  }
};


exports.loginForm = (req, res) => {
  res.render('auth/login');
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Save user info in session
    req.session.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      className: user.className,
      stream: user.stream || null
    };

    req.session.success_msg = `Welcome back, ${user.fullName}!`;
    
    // Redirect based on role
    const redirectPath = {
      student: '/dashboard/student',
      teacher: '/dashboard/teacher',
      parent: '/dashboard/parent',
      admin: '/dashboard/admin',
    };

    res.redirect(redirectPath[user.role]);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Something went wrong during login.');
    res.redirect('/login');
  }
};


exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
