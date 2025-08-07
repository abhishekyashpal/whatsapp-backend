const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const messageController = require('../controllers/messages.controller');


router.post('/send', verifyToken, messageController.sendMessage);
router.get('/:userId', verifyToken, messageController.getMessagesWithUser);

module.exports = router;


