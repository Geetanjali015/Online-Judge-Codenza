const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const BCRYPT_SALT_ROUNDS = 12;
const JWT_EXPIRY = '7d';

const createAuthenticationError = () => {
  const error = new Error('Invalid email or password');
  error.statusCode = 401;
  return error;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment');
  }

  return process.env.JWT_SECRET;
};

/**
 * Creates a new user after enforcing email uniqueness and hashing the password.
 * Only the hash is persisted; the plaintext password is never stored.
 */
const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.exists({ email });

  if (existingUser) {
    const error = new Error('Email already exists');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  await User.create({
    name,
    email,
    passwordHash,
  });
};

/**
 * Verifies credentials and returns a seven-day authentication token.
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw createAuthenticationError();
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw createAuthenticationError();
  }

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRY }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      solvedProblems: user.solvedProblems,
      totalSubmissions: user.totalSubmissions,
    },
  };
};

/**
 * Loads only public profile fields for the authenticated user.
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select(
    'name email role avatar solvedProblems totalSubmissions createdAt updatedAt'
  );

  if (!user) {
    const error = new Error('Authenticated user not found');
    error.statusCode = 401;
    throw error;
  }

  return user;
};

module.exports = {
  getUserProfile,
  loginUser,
  registerUser,
};
