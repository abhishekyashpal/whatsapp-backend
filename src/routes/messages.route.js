const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const messageController = require('../controllers/message.controller');


router.post('/send', verifyToken, messageController.sendMessage);
router.get('/:userId', verifyToken, messageController.getMessagesWithUser);

module.exports = router;


