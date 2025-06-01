const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

router.get('/messages', isAuthenticated, messageController.inbox);
router.get('/messages/new', isAuthenticated, messageController.newMessageForm);
router.post('/messages', isAuthenticated, messageController.sendMessage);
router.get('/messages/sent', isAuthenticated, messageController.sentMessages);

module.exports = router;