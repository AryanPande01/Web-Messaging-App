const User = require('../models/User');
const generateToken = require('../utils/generateToken');

class AuthService {
  async registerUser(userData) {
    const { name, username, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      throw new Error('User already exists with this email or username');
    }

    // Create new user
    const user = new User({
      name,
      username,
      email,
      password
    });

    await user.save();
    const token = generateToken(user._id);

    return { user, token };
  }

  async loginUser(email, password) {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user._id);
    return { user, token };
  }
}

module.exports = new AuthService();

