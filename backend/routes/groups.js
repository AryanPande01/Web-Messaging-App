const express = require('express');
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', groupController.createGroup);
router.get('/', groupController.getUserGroups);
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', groupController.updateGroup);
router.post('/:groupId/members', groupController.addMembers);
router.delete('/:groupId/members', groupController.removeMember);

module.exports = router;

