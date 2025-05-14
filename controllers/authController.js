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
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('auth/register', { error: 'Email already exists or error saving user' });
  }
};

exports.loginForm = (req, res) => {
  res.render('auth/login');
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.render('auth/login', { error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('auth/login', { error: 'Invalid email or password' });

    // After successful login or registration, save the user info in session
req.session.user = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture, // Ensure this is set correctly
  };

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
    res.render('auth/login', { error: 'Login failed' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
