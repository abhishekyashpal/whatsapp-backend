const express = require('express');
const router = express.Router();
const { getRecentChatList } = require('../controllers/chat.controller');


router.get("/recent/", getRecentChatList);


module.exports = router;
