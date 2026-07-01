const { validationResult } = require('express-validator');

const { registerUser } = require('../services/authService');

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

module.exports = {
  register,
};

