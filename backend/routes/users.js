const express = require('express');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name username email profilePicture bio friends')
      .populate('friends', 'name username profilePicture isOnline');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { name, bio, profilePicture } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update settings
router.put('/settings', async (req, res) => {
  try {
    const { theme, privacy } = req.body;
    const user = await User.findById(req.user._id);

    if (theme) user.settings.theme = theme;
    if (privacy) {
      user.settings.privacy = {
        ...user.settings.privacy,
        ...privacy
      };
    }

    await user.save();
    res.json({ settings: user.settings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Block/Unblock user
router.post('/block', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.blockedUsers.includes(userId)) {
      user.blockedUsers.push(userId);
      // Remove from friends if exists
      user.friends = user.friends.filter(
        friendId => friendId.toString() !== userId.toString()
      );
      await user.save();
    }

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/unblock', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);

    user.blockedUsers = user.blockedUsers.filter(
      blockedId => blockedId.toString() !== userId.toString()
    );
    await user.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get blocked users
router.get('/blocked/list', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'name username profilePicture');
    
    res.json({ blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

