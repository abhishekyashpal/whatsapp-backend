const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const { getChatMessages } = require('../controllers/messages.controller');



router.get('/:chatId/', getChatMessages);

module.exports = router;


