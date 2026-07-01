const { validationResult } = require('express-validator');

const { getUserProfile, loginUser, registerUser } = require('../services/authService');

/**
 * Handles POST /auth/register after the route's validation chain has run.
 */
const register = async (req, res) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: validationErrors.array(),
    });
  }

  try {
    await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    // MongoDB error 11000 protects against concurrent duplicate registrations.
    if (error.statusCode === 409 || error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    console.error('User registration failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Handles POST /auth/login and returns a JWT after valid credentials.
 */
const login = async (req, res) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: validationErrors.array(),
    });
  }

  try {
    const authentication = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      ...authentication,
    });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    console.error('User login failed:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * Handles GET /auth/me for a token-authenticated user.
 */
const getMe = async (req, res) => {
  try {
    const user = await getUserProfile(req.user.userId);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({ message: error.message });
    }

    console.error('Failed to retrieve authenticated user:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getMe,
  login,
  register,
};
