const express = require('express');
const friendController = require('../controllers/friendController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/search', friendController.searchUsers);
router.post('/request', friendController.sendFriendRequest);
router.post('/accept', friendController.acceptFriendRequest);
router.post('/decline', friendController.declineFriendRequest);
router.get('/suggestions', friendController.getSuggestedUsers);

module.exports = router;

