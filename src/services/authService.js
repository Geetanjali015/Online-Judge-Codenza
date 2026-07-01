const bcrypt = require('bcrypt');

const User = require('../models/User');

const BCRYPT_SALT_ROUNDS = 12;

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

module.exports = {
  registerUser,
};

