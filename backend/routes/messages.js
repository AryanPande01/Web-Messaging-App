const express = require('express');
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/chats', messageController.getChatList);
router.get('/chat/:userId', messageController.getChatMessages);
router.get('/group/:groupId', messageController.getGroupMessages);
router.put('/seen/:userId', messageController.markMessagesAsSeen);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;

