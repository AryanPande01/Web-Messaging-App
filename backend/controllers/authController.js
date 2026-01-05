const authService = require('../services/authService');
const { validationResult } = require('express-validator');

class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user, token } = await authService.registerUser(req.body);
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture
        }
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const { user, token } = await authService.loginUser(email, password);
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture
        }
      });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  async getMe(req, res) {
    try {
      const user = await require('../models/User').findById(req.user._id)
        .select('-password')
        .populate('friends', 'name username profilePicture isOnline')
        .populate('friendRequestsReceived', 'name username profilePicture')
        .populate('friendRequestsSent', 'name username profilePicture');
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new AuthController();

