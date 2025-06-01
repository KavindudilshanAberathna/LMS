const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../config/multer');

const authController = require('../controllers/authController')

//landing page
router.get('/', (req, res) => {
  res.render('index');
});

// Register
router.get('/register', authController.registerForm);
router.post('/register', upload.single('profilePicture'), authController.register);

// Login
router.get('/login', authController.loginForm);
router.post('/login', authController.login);

// Logout
router.get('/logout', authController.logout);


module.exports = router;
